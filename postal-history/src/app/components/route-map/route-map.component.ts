import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LetterService } from '../../services/letter.service';
import { ValidationService } from '../../services/validation.service';
import { Letter, RouteSegment, Postmark } from '../../models/letter.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-route-map',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatDividerModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="page-header">
      <button mat-button (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        返回
      </button>
      <h1 *ngIf="letter">{{ letter.title }} - 流转路线</h1>
      <button mat-raised-button color="primary" (click)="editLetter()" *ngIf="letter">
        <mat-icon>edit</mat-icon>
        编辑信件
      </button>
    </div>

    <div class="map-container">
      <div class="map-wrapper">
        <div #map class="map"></div>

        <div class="map-overlay" *ngIf="!canGenerateRoute">
          <mat-icon color="warn">warning</mat-icon>
          <h3>无法生成流转路线图</h3>
          <p>存在时间倒序或缺少起止地点，请先修正数据。</p>
          <button mat-raised-button color="primary" (click)="editLetter()">
            前往编辑
          </button>
        </div>
      </div>

      <div class="sidebar">
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>路线信息</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="route-stats">
              <div class="stat-item">
                <span class="stat-label">总站点数</span>
                <span class="stat-value">{{ sortedPostmarks.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总距离</span>
                <span class="stat-value">{{ totalDistance }} km</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">总时长</span>
                <span class="stat-value">{{ totalDuration }} 天</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="segments-card">
          <mat-card-header>
            <mat-card-title>路线分段</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <div *ngFor="let segment of segments; let i = index">
                <mat-list-item class="segment-item" [class.anomaly]="segment.isAnomaly">
                  <div class="segment-header">
                    <span class="segment-number">{{ i + 1 }}</span>
                    <span class="segment-route">
                      {{ segment.from.locationName }} → {{ segment.to.locationName }}
                    </span>
                    <mat-chip *ngIf="segment.isAnomaly" color="warn" class="anomaly-chip">
                      异常
                    </mat-chip>
                  </div>
                  <div class="segment-details">
                    <span *ngIf="segment.durationDays !== null">
                      <mat-icon>schedule</mat-icon>
                      {{ segment.durationDays }} 天
                    </span>
                    <span *ngIf="segment.distanceKm !== null">
                      <mat-icon>straighten</mat-icon>
                      {{ segment.distanceKm }} km
                    </span>
                  </div>
                  <div class="segment-dates">
                    <span *ngIf="segment.from.postmarkDate">{{ segment.from.postmarkDate }}</span>
                    <span *ngIf="segment.to.postmarkDate">→ {{ segment.to.postmarkDate }}</span>
                  </div>
                  <div class="anomaly-reason" *ngIf="segment.isAnomaly && segment.anomalyReason">
                    <mat-icon color="warn">info</mat-icon>
                    {{ segment.anomalyReason }}
                  </div>
                </mat-list-item>
                <mat-divider *ngIf="i < segments.length - 1"></mat-divider>
              </div>
            </mat-list>
          </mat-card-content>
        </mat-card>

        <mat-card class="legend-card">
          <mat-card-header>
            <mat-card-title>图例</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="legend-item">
              <span class="legend-marker origin"></span>
              <span>寄出地</span>
            </div>
            <div class="legend-item">
              <span class="legend-marker transit"></span>
              <span>中转地</span>
            </div>
            <div class="legend-item">
              <span class="legend-marker destination"></span>
              <span>目的地</span>
            </div>
            <div class="legend-item">
              <span class="legend-marker missing"></span>
              <span>信息缺失</span>
            </div>
            <div class="legend-item">
              <span class="legend-line normal"></span>
              <span>正常路线</span>
            </div>
            <div class="legend-item">
              <span class="legend-line anomaly"></span>
              <span>异常路线</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .page-header h1 {
      margin: 0;
      color: #5d4037;
      font-size: 1.5rem;
    }
    .map-container {
      display: flex;
      gap: 20px;
      height: calc(100vh - 140px);
      min-height: 500px;
    }
    .map-wrapper {
      flex: 1;
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      min-height: 500px;
      height: 100%;
    }
    .map {
      width: 100%;
      height: 100%;
      min-height: 500px;
    }
    .map-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .map-overlay mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }
    .map-overlay h3 {
      margin: 0 0 8px 0;
      color: #d32f2f;
    }
    .map-overlay p {
      margin: 0 0 24px 0;
      color: #666;
    }
    .sidebar {
      width: 360px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
    }
    .info-card .route-stats {
      display: flex;
      justify-content: space-around;
      text-align: center;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-label {
      font-size: 0.85rem;
      color: #999;
    }
    .stat-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #5d4037;
    }
    .segments-card {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .segments-card mat-card-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }
    .segment-item {
      height: auto !important;
      padding: 12px 0 !important;
    }
    .segment-item.anomaly {
      background: #fff3f3;
    }
    .segment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .segment-number {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #5d4037;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    .segment-route {
      flex: 1;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .anomaly-chip {
      font-size: 0.7rem;
      --mdc-chip-label-text-color: white;
    }
    .segment-details {
      display: flex;
      gap: 16px;
      color: #666;
      font-size: 0.85rem;
      margin-bottom: 4px;
    }
    .segment-details span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .segment-details mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .segment-dates {
      color: #999;
      font-size: 0.8rem;
    }
    .anomaly-reason {
      margin-top: 8px;
      padding: 8px;
      background: #ffebee;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #c62828;
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }
    .anomaly-reason mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .legend-card {
      margin-top: auto;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
      font-size: 0.85rem;
    }
    .legend-marker {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .legend-marker.origin {
      background: #4caf50;
    }
    .legend-marker.transit {
      background: #ff9800;
    }
    .legend-marker.destination {
      background: #f44336;
    }
    .legend-marker.missing {
      background: #9e9e9e;
    }
    .legend-line {
      width: 24px;
      height: 4px;
      border-radius: 2px;
    }
    .legend-line.normal {
      background: #1976d2;
    }
    .legend-line.anomaly {
      background: #f44336;
      border: 1px dashed #f44336;
    }
  `]
})
export class RouteMapComponent implements OnInit, AfterViewInit {
  @ViewChild('map') set mapContainer(element: ElementRef) {
    if (element && !this.map) {
      this._mapContainer = element;
      this.tryInitMap();
    }
  }

  private _mapContainer: ElementRef | null = null;

  letter: Letter | null = null;
  letterId: string = '';
  sortedPostmarks: Postmark[] = [];
  segments: RouteSegment[] = [];
  canGenerateRoute = false;

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private polylines: L.Polyline[] = [];
  private mapInitialized = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private letterService: LetterService,
    private validationService: ValidationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.letterId = this.route.snapshot.paramMap.get('id') || '';
    this.loadLetter();

    this.letterService.letters$.subscribe(() => {
      this.loadLetter();
      if (this.map && this.canGenerateRoute) {
        this.renderMap();
      }
    });
  }

  ngAfterViewInit(): void {
    this.tryInitMap();
  }

  private tryInitMap(): void {
    if (this.mapInitialized || !this._mapContainer) return;

    try {
      this.initMap();
      this.mapInitialized = true;
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Map initialization error:', e);
    }
  }

  private loadLetter(): void {
    const letter = this.letterService.getLetterById(this.letterId);
    if (letter) {
      this.letter = letter;
      this.sortedPostmarks = this.letterService.getSortedPostmarks(letter);
      this.segments = this.letterService.getRouteSegments(letter);
      this.canGenerateRoute = this.validationService.canGenerateRouteMap(letter);

      if (this.map && this.canGenerateRoute) {
        this.renderMap();
      }
    }
  }

  private initMap(): void {
    if (!this._mapContainer) return;

    this.map = L.map(this._mapContainer.nativeElement).setView([35.8617, 104.1954], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize();
      if (this.canGenerateRoute && this.letter) {
        this.renderMap();
      }
    }, 300);
  }

  private renderMap(): void {
    if (!this.map || !this.letter) return;

    this.clearMapLayers();

    const validCoords: L.LatLngExpression[] = [];

    for (let i = 0; i < this.sortedPostmarks.length; i++) {
      const postmark = this.sortedPostmarks[i];
      const hasValidCoords = postmark.latitude !== null && postmark.longitude !== null;

      if (hasValidCoords) {
        validCoords.push([postmark.latitude!, postmark.longitude!]);
      }

      this.addMarker(postmark, i);
    }

    this.drawRoutes();

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords as L.LatLngTuple[]);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  private clearMapLayers(): void {
    for (const marker of this.markers) {
      marker.remove();
    }
    this.markers = [];

    for (const polyline of this.polylines) {
      polyline.remove();
    }
    this.polylines = [];
  }

  private addMarker(postmark: Postmark, index: number): void {
    if (!this.map) return;

    const hasValidCoords = postmark.latitude !== null && postmark.longitude !== null;
    const isMissing = !hasValidCoords || !postmark.postmarkDate;

    let color = '#ff9800';
    if (postmark.type === 'origin') color = '#4caf50';
    if (postmark.type === 'destination') color = '#f44336';
    if (isMissing) color = '#9e9e9e';

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">${index + 1}</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const lat = hasValidCoords ? postmark.latitude! : 0;
    const lng = hasValidCoords ? postmark.longitude! : 0;

    const marker = L.marker([lat, lng], { icon });

    const popupContent = `
      <div style="min-width: 180px;">
        <h4 style="margin: 0 0 8px 0; color: ${color};">
          ${postmark.locationName || '未知地点'}
        </h4>
        <p style="margin: 4px 0; font-size: 12px;">
          <strong>类型：</strong>${this.getPostmarkTypeLabel(postmark.type)}
        </p>
        <p style="margin: 4px 0; font-size: 12px;">
          <strong>日期：</strong>${postmark.postmarkDate || '未知'}
        </p>
        <p style="margin: 4px 0; font-size: 12px;">
          <strong>清晰度：</strong>${this.getClarityLabel(postmark.clarity)}
        </p>
        <p style="margin: 4px 0; font-size: 12px;">
          <strong>经纬度：</strong>${hasValidCoords ? `${postmark.latitude?.toFixed(4)}, ${postmark.longitude?.toFixed(4)}` : '未知'}
        </p>
        ${postmark.notes ? `<p style="margin: 4px 0; font-size: 12px;"><strong>备注：</strong>${postmark.notes}</p>` : ''}
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(this.map);
    this.markers.push(marker);
  }

  private drawRoutes(): void {
    if (!this.map) return;

    for (const segment of this.segments) {
      const fromHasCoords = segment.from.latitude !== null && segment.from.longitude !== null;
      const toHasCoords = segment.to.latitude !== null && segment.to.longitude !== null;

      if (fromHasCoords && toHasCoords) {
        const latlngs: L.LatLngExpression[] = [
          [segment.from.latitude!, segment.from.longitude!],
          [segment.to.latitude!, segment.to.longitude!]
        ];

        const color = segment.isAnomaly ? '#f44336' : '#1976d2';
        const dashArray = segment.isAnomaly ? '10, 10' : undefined;

        const polyline = L.polyline(latlngs, {
          color,
          weight: 3,
          opacity: 0.8,
          dashArray
        });

        polyline.addTo(this.map);
        this.polylines.push(polyline);

        const midLat = (segment.from.latitude! + segment.to.latitude!) / 2;
        const midLng = (segment.from.longitude! + segment.to.longitude!) / 2;

        const label = segment.durationDays !== null
          ? `${segment.durationDays} 天${segment.distanceKm !== null ? ` · ${segment.distanceKm} km` : ''}`
          : segment.distanceKm !== null ? `${segment.distanceKm} km` : '';

        if (label) {
          const labelIcon = L.divIcon({
            className: 'route-label',
            html: `<div style="
              background: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              white-space: nowrap;
              color: ${segment.isAnomaly ? '#f44336' : '#1976d2'};
              font-weight: 500;
            ">${label}</div>`,
            iconSize: [100, 24],
            iconAnchor: [50, 12]
          });

          const labelMarker = L.marker([midLat, midLng], { icon: labelIcon });
          labelMarker.addTo(this.map);
          this.markers.push(labelMarker);
        }
      }
    }
  }

  get totalDistance(): string {
    const total = this.segments.reduce((sum, s) => sum + (s.distanceKm || 0), 0);
    return total > 0 ? total.toLocaleString() : '-';
  }

  get totalDuration(): string {
    const origin = this.sortedPostmarks.find(p => p.type === 'origin');
    const dest = this.sortedPostmarks.find(p => p.type === 'destination');
    if (origin?.postmarkDate && dest?.postmarkDate) {
      const start = new Date(origin.postmarkDate);
      const end = new Date(dest.postmarkDate);
      const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 ? days.toString() : '-';
    }
    return '-';
  }

  private getPostmarkTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      origin: '寄出地',
      transit: '中转地',
      destination: '目的地'
    };
    return labels[type] || type;
  }

  private getClarityLabel(clarity: string): string {
    const labels: Record<string, string> = {
      clear: '清晰',
      partial: '部分清晰',
      fuzzy: '模糊'
    };
    return labels[clarity] || clarity;
  }

  editLetter(): void {
    this.router.navigate(['/letters', this.letterId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/letters']);
  }
}
