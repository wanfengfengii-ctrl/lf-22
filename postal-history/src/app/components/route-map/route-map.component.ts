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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { LetterService } from '../../services/letter.service';
import { ValidationService } from '../../services/validation.service';
import { ConfidenceService } from '../../services/confidence.service';
import { Letter, RouteSegment, Postmark, RouteVersion, RouteDiffNode, RouteDiffSegment } from '../../models/letter.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-route-map',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatTabsModule
  ],
  template: `
    <div class="page-header">
      <button mat-button (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        返回
      </button>
      <h1 *ngIf="letter">{{ letter.title }} - 流转路线</h1>
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="editLetter()" *ngIf="letter">
          <mat-icon>edit</mat-icon>
          编辑信件
        </button>
      </div>
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

        <div class="version-selector" *ngIf="versions.length > 1">
          <mat-card>
            <mat-card-content>
              <div class="selector-row">
                <div class="selector-item">
                  <span class="selector-label">方案 A</span>
                  <mat-form-field appearance="outline" class="selector-field">
                    <mat-select [(value)]="selectedVersionA" (valueChange)="onVersionChange()">
                      <mat-option *ngFor="let v of versions" [value]="v.id">
                        {{ v.name }} {{ v.isOfficial ? '(正式)' : '' }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="selector-vs">
                  <mat-icon>compare_arrows</mat-icon>
                </div>
                <div class="selector-item">
                  <span class="selector-label">方案 B</span>
                  <mat-form-field appearance="outline" class="selector-field">
                    <mat-select [(value)]="selectedVersionB" (valueChange)="onVersionChange()">
                      <mat-option *ngFor="let v of versions" [value]="v.id">
                        {{ v.name }} {{ v.isOfficial ? '(正式)' : '' }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="view-toggle">
                  <button
                    mat-raised-button
                    [color]="compareMode ? 'primary' : ''"
                    (click)="toggleCompareMode()"
                  >
                    <mat-icon>{{ compareMode ? 'layers' : 'compare' }}</mat-icon>
                    {{ compareMode ? '对比模式' : '单方案模式' }}
                  </button>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <div class="sidebar">
        <ng-container *ngIf="compareMode && diffResult">
          <mat-card class="compare-summary-card">
            <mat-card-header>
              <mat-card-title>方案对比总结</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="compare-stats">
                <div class="stat-row">
                  <span class="stat-label">新增节点</span>
                  <span class="stat-value added">{{ diffResult.addedCount }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">移除节点</span>
                  <span class="stat-value removed">{{ diffResult.removedCount }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">修改节点</span>
                  <span class="stat-value modified">{{ diffResult.modifiedCount }}</span>
                </div>
              </div>

              <div class="version-comparison" *ngIf="versionA && versionB">
                <mat-divider style="margin: 16px 0;"></mat-divider>
                <div class="version-compare-row">
                  <div class="version-col">
                    <h4>{{ versionA.name }}</h4>
                    <div class="mini-stat">
                      <span>{{ versionA.postmarks.length }} 个站点</span>
                    </div>
                    <div class="mini-stat">
                      <span>总距离: {{ getVersionDistance(versionA) }} km</span>
                    </div>
                    <div class="mini-stat">
                      <span>总时长: {{ getVersionDurationLabel(versionA) }}</span>
                    </div>
                    <div class="confidence-mini" *ngIf="getConfidence(versionA)">
                      <span class="confidence-label">可信度</span>
                      <span
                        class="confidence-value"
                        [style.color]="confidenceService.getConfidenceColor(getConfidence(versionA)?.percentage || 0)"
                      >
                        {{ getConfidence(versionA)?.percentage }}%
                      </span>
                    </div>
                  </div>
                  <div class="version-col">
                    <h4>{{ versionB.name }}</h4>
                    <div class="mini-stat">
                      <span>{{ versionB.postmarks.length }} 个站点</span>
                    </div>
                    <div class="mini-stat">
                      <span>总距离: {{ getVersionDistance(versionB) }} km</span>
                    </div>
                    <div class="mini-stat">
                      <span>总时长: {{ getVersionDurationLabel(versionB) }}</span>
                    </div>
                    <div class="confidence-mini" *ngIf="getConfidence(versionB)">
                      <span class="confidence-label">可信度</span>
                      <span
                        class="confidence-value"
                        [style.color]="confidenceService.getConfidenceColor(getConfidence(versionB)?.percentage || 0)"
                      >
                        {{ getConfidence(versionB)?.percentage }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="diff-nodes-card">
            <mat-card-header>
              <mat-card-title>节点差异详情</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-list class="diff-node-list">
                <div
                  *ngFor="let node of diffResult.nodes; let i = index"
                  class="diff-node-item"
                  [class.added]="node.diffType === 'added'"
                  [class.removed]="node.diffType === 'removed'"
                  [class.modified]="node.diffType === 'modified'"
                >
                  <div class="diff-node-header">
                    <mat-icon class="diff-icon">
                      {{ node.diffType === 'added' ? 'add_circle' : node.diffType === 'removed' ? 'remove_circle' : 'edit' }}
                    </mat-icon>
                    <span class="diff-node-name">{{ node.postmark.locationName }}</span>
                    <span class="diff-type-badge" [ngClass]="node.diffType">
                      {{ getDiffTypeLabel(node.diffType) }}
                    </span>
                  </div>
                  <div class="diff-node-details" *ngIf="node.diffType !== 'same'">
                    <span *ngIf="node.postmark.postmarkDate">
                      <mat-icon>calendar_today</mat-icon>
                      {{ node.postmark.postmarkDate }}
                    </span>
                    <span *ngIf="node.postmark.clarity">
                      <mat-icon>visibility</mat-icon>
                      {{ getClarityLabel(node.postmark.clarity) }}
                    </span>
                  </div>
                </div>
              </mat-list>
            </mat-card-content>
          </mat-card>
        </ng-container>

        <ng-container *ngIf="!compareMode">
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

              <div class="confidence-section" *ngIf="currentConfidence">
                <mat-divider style="margin: 12px 0;"></mat-divider>
                <div class="confidence-header">
                  <span class="confidence-label">可信度评分</span>
                  <span
                    class="confidence-score"
                    [style.color]="confidenceService.getConfidenceColor(currentConfidence.percentage)"
                  >
                    {{ currentConfidence.percentage }}%
                  </span>
                </div>
                <mat-progress-bar
                  mode="determinate"
                  [value]="currentConfidence.percentage"
                  color="primary"
                ></mat-progress-bar>
                <div class="confidence-label-text">
                  {{ confidenceService.getConfidenceLabel(currentConfidence.percentage) }}
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
        </ng-container>

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

            <ng-container *ngIf="compareMode">
              <mat-divider style="margin: 8px 0;"></mat-divider>
              <div class="legend-item">
                <span class="legend-line version-a"></span>
                <span>方案 A</span>
              </div>
              <div class="legend-item">
                <span class="legend-line version-b"></span>
                <span>方案 B</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker added"></span>
                <span>新增节点</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker removed"></span>
                <span>移除节点</span>
              </div>
              <div class="legend-item">
                <span class="legend-marker modified"></span>
                <span>修改节点</span>
              </div>
            </ng-container>

            <ng-container *ngIf="!compareMode">
              <div class="legend-item">
                <span class="legend-line normal"></span>
                <span>正常路线</span>
              </div>
              <div class="legend-item">
                <span class="legend-line anomaly"></span>
                <span>异常路线</span>
              </div>
            </ng-container>
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
    .header-actions {
      display: flex;
      gap: 8px;
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
    .version-selector {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      z-index: 900;
    }
    .version-selector mat-card {
      max-width: 700px;
      margin: 0 auto;
    }
    .selector-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .selector-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .selector-label {
      font-size: 0.85rem;
      font-weight: 500;
      color: #666;
    }
    .selector-field {
      width: 100%;
    }
    .selector-vs {
      padding-top: 20px;
      color: #999;
    }
    .view-toggle {
      padding-top: 20px;
    }
    .sidebar {
      width: 380px;
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
    .confidence-section {
      margin-top: 8px;
    }
    .confidence-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .confidence-header .confidence-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: #666;
    }
    .confidence-header .confidence-score {
      font-size: 1.2rem;
      font-weight: bold;
    }
    .confidence-label-text {
      text-align: center;
      font-size: 0.85rem;
      color: #666;
      margin-top: 6px;
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
    .compare-summary-card .compare-stats {
      display: flex;
      justify-content: space-around;
      text-align: center;
    }
    .stat-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-row .stat-label {
      font-size: 0.85rem;
      color: #666;
    }
    .stat-row .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
    }
    .stat-value.added {
      color: #4caf50;
    }
    .stat-value.removed {
      color: #f44336;
    }
    .stat-value.modified {
      color: #ff9800;
    }
    .version-comparison {
      margin-top: 8px;
    }
    .version-compare-row {
      display: flex;
      gap: 16px;
    }
    .version-col {
      flex: 1;
    }
    .version-col h4 {
      margin: 0 0 8px 0;
      color: #5d4037;
      font-size: 0.95rem;
    }
    .mini-stat {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 4px;
    }
    .confidence-mini {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #eee;
    }
    .confidence-mini .confidence-label {
      font-size: 0.8rem;
      color: #999;
    }
    .confidence-mini .confidence-value {
      font-weight: bold;
      font-size: 0.95rem;
    }
    .diff-nodes-card {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .diff-nodes-card mat-card-content {
      flex: 1;
      overflow-y: auto;
      padding: 0 !important;
    }
    .diff-node-list {
      padding: 0 !important;
    }
    .diff-node-item {
      padding: 12px 16px;
      border-left: 3px solid #e0e0e0;
      margin-bottom: 4px;
      background: #fafafa;
      border-radius: 0 4px 4px 0;
    }
    .diff-node-item.added {
      border-left-color: #4caf50;
      background: #e8f5e9;
    }
    .diff-node-item.removed {
      border-left-color: #f44336;
      background: #ffebee;
    }
    .diff-node-item.modified {
      border-left-color: #ff9800;
      background: #fff3e0;
    }
    .diff-node-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .diff-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .diff-node-item.added .diff-icon {
      color: #4caf50;
    }
    .diff-node-item.removed .diff-icon {
      color: #f44336;
    }
    .diff-node-item.modified .diff-icon {
      color: #ff9800;
    }
    .diff-node-name {
      flex: 1;
      font-weight: 500;
    }
    .diff-type-badge {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 10px;
      color: white;
    }
    .diff-type-badge.added {
      background: #4caf50;
    }
    .diff-type-badge.removed {
      background: #f44336;
    }
    .diff-type-badge.modified {
      background: #ff9800;
    }
    .diff-node-details {
      display: flex;
      gap: 16px;
      font-size: 0.8rem;
      color: #666;
      padding-left: 28px;
    }
    .diff-node-details span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .diff-node-details mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
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
    .legend-marker.added {
      background: #4caf50;
      border: 3px solid #2e7d32;
    }
    .legend-marker.removed {
      background: #f44336;
      border: 3px solid #c62828;
    }
    .legend-marker.modified {
      background: #ff9800;
      border: 3px solid #e65100;
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
    .legend-line.version-a {
      background: #1976d2;
      height: 6px;
    }
    .legend-line.version-b {
      background: #9c27b0;
      height: 6px;
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

  versions: RouteVersion[] = [];
  selectedVersionA: string = '';
  selectedVersionB: string = '';
  compareMode = false;

  diffResult: {
    nodes: RouteDiffNode[];
    segments: RouteDiffSegment[];
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
  } | null = null;

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private polylines: L.Polyline[] = [];
  private mapInitialized = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private letterService: LetterService,
    private validationService: ValidationService,
    public confidenceService: ConfidenceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.letterId = this.route.snapshot.paramMap.get('id') || '';
    this.loadLetter();

    this.letterService.letters$.subscribe(() => {
      this.loadLetter();
      if (this.map) {
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
      this.versions = letter.versions || [];

      if (this.versions.length > 0) {
        this.selectedVersionA = this.versions[0].id;
        this.selectedVersionB = this.versions.length > 1 ? this.versions[1].id : this.versions[0].id;
        this.compareMode = this.versions.length > 1;
      }

      this.updateCurrentData();

      if (this.map) {
        this.renderMap();
      }
    }
  }

  private updateCurrentData(): void {
    if (!this.letter) return;

    if (this.compareMode && this.selectedVersionA && this.selectedVersionB) {
      this.diffResult = this.confidenceService.compareRoutes(
        this.getVersionById(this.selectedVersionA)?.postmarks || [],
        this.getVersionById(this.selectedVersionB)?.postmarks || []
      );
      this.canGenerateRoute = this.canGenerateAnyRoute();
    } else {
      const postmarks = this.letterService.getVersionPostmarks(this.letterId, this.selectedVersionA || undefined);
      this.sortedPostmarks = [...postmarks].sort((a, b) => a.sequence - b.sequence);

      const version = this.getVersionById(this.selectedVersionA);
      if (version) {
        this.segments = this.letterService.getRouteSegmentsForVersion(version);
      } else {
        this.segments = this.letterService.getRouteSegments(this.letter);
      }

      const fakeLetter = { ...this.letter, postmarks: this.sortedPostmarks } as any;
      this.canGenerateRoute = this.validationService.canGenerateRouteMap(fakeLetter);
    }
  }

  get versionA(): RouteVersion | undefined {
    return this.getVersionById(this.selectedVersionA);
  }

  get versionB(): RouteVersion | undefined {
    return this.getVersionById(this.selectedVersionB);
  }

  get currentConfidence(): any {
    if (!this.letter) return null;
    const postmarks = this.letterService.getVersionPostmarks(this.letterId, this.selectedVersionA || undefined);
    return this.confidenceService.calculateConfidence(postmarks);
  }

  getConfidence(version: RouteVersion): any {
    return this.confidenceService.calculateConfidence(version.postmarks);
  }

  private getVersionById(id: string): RouteVersion | undefined {
    return this.versions.find(v => v.id === id);
  }

  onVersionChange(): void {
    this.updateCurrentData();
    if (this.map) {
      this.renderMap();
    }
  }

  toggleCompareMode(): void {
    this.compareMode = !this.compareMode;
    this.updateCurrentData();
    if (this.map) {
      this.renderMap();
    }
  }

  getVersionDistance(version: RouteVersion): string {
    const dist = this.letterService.getVersionTotalDistance(version);
    return dist > 0 ? dist.toLocaleString() : '-';
  }

  getVersionDurationLabel(version: RouteVersion): string {
    const duration = this.letterService.getVersionDuration(version);
    return duration !== null ? `${duration} 天` : '-';
  }

  getDiffTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      added: '新增',
      removed: '移除',
      modified: '修改',
      same: '相同'
    };
    return labels[type] || type;
  }

  getClarityLabel(clarity: string): string {
    const labels: Record<string, string> = {
      clear: '清晰',
      partial: '部分清晰',
      fuzzy: '模糊'
    };
    return labels[clarity] || clarity;
  }

  private canGenerateAnyRoute(): boolean {
    if (!this.versionA || !this.versionB) return false;
    const fakeA = { postmarks: this.versionA.postmarks } as any;
    const fakeB = { postmarks: this.versionB.postmarks } as any;
    return this.validationService.canGenerateRouteMap(fakeA) ||
           this.validationService.canGenerateRouteMap(fakeB);
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

    if (this.compareMode) {
      this.renderCompareMap();
    } else {
      this.renderSingleMap();
    }
  }

  private renderCompareMap(): void {
    if (!this.map || !this.versionA || !this.versionB) return;

    const allCoords: L.LatLngExpression[] = [];

    this.drawVersionRoute(this.versionA, '#1976d2', 3, 0, false);
    this.drawVersionRoute(this.versionB, '#9c27b0', 3, 0, true);

    if (this.diffResult) {
      for (const node of this.diffResult.nodes) {
        if (node.diffType !== 'same') {
          const hasCoords = node.postmark.latitude !== null && node.postmark.longitude !== null;
          if (hasCoords) {
            allCoords.push([node.postmark.latitude!, node.postmark.longitude!]);
          }
        }
      }
    }

    const sortedA = [...this.versionA.postmarks].sort((a, b) => a.sequence - b.sequence);
    const sortedB = [...this.versionB.postmarks].sort((a, b) => a.sequence - b.sequence);

    for (const pm of sortedA) {
      if (pm.latitude !== null && pm.longitude !== null) {
        allCoords.push([pm.latitude, pm.longitude]);
      }
    }
    for (const pm of sortedB) {
      if (pm.latitude !== null && pm.longitude !== null) {
        allCoords.push([pm.latitude, pm.longitude]);
      }
    }

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords as L.LatLngTuple[]);
      this.map.fitBounds(bounds, { padding: [60, 60] });
    }
  }

  private drawVersionRoute(version: RouteVersion, color: string, weight: number, dashOffset: number, isVersionB: boolean): void {
    if (!this.map) return;

    const sorted = [...version.postmarks].sort((a, b) => a.sequence - b.sequence);

    for (let i = 0; i < sorted.length; i++) {
      const postmark = sorted[i];
      const hasValidCoords = postmark.latitude !== null && postmark.longitude !== null;

      if (hasValidCoords) {
        const diffType = this.getNodeDiffType(postmark.locationName, isVersionB);
        this.addCompareMarker(postmark, i, color, diffType, isVersionB);
      }
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i];
      const to = sorted[i + 1];

      const fromHasCoords = from.latitude !== null && from.longitude !== null;
      const toHasCoords = to.latitude !== null && to.longitude !== null;

      if (fromHasCoords && toHasCoords) {
        const latlngs: L.LatLngExpression[] = [
          [from.latitude!, from.longitude!],
          [to.latitude!, to.longitude!]
        ];

        const diffType = this.getSegmentDiffType(from.locationName, to.locationName, isVersionB);
        let lineColor = color;
        let dashArray: string | undefined = undefined;

        if (diffType === 'added' || diffType === 'removed') {
          dashArray = '10, 10';
        } else if (diffType === 'modified') {
          lineColor = isVersionB ? '#9c27b0' : '#1976d2';
        }

        const polyline = L.polyline(latlngs, {
          color: lineColor,
          weight,
          opacity: 0.7,
          dashArray
        });

        polyline.addTo(this.map);
        this.polylines.push(polyline);
      }
    }
  }

  private getNodeDiffType(locationName: string, isVersionB: boolean): 'same' | 'added' | 'removed' | 'modified' {
    if (!this.diffResult) return 'same';

    const node = this.diffResult.nodes.find(n => n.postmark.locationName === locationName);
    if (!node) return 'same';

    if (node.diffType === 'same' || node.diffType === 'modified') return node.diffType;
    if (isVersionB && node.diffType === 'added') return 'added';
    if (!isVersionB && node.diffType === 'removed') return 'removed';
    return 'same';
  }

  private getSegmentDiffType(fromName: string, toName: string, isVersionB: boolean): 'same' | 'added' | 'removed' | 'modified' {
    if (!this.diffResult) return 'same';

    const fromNode = this.diffResult.nodes.find(n => n.postmark.locationName === fromName);
    const toNode = this.diffResult.nodes.find(n => n.postmark.locationName === toName);

    if (!fromNode || !toNode) return 'same';

    const types = [fromNode.diffType, toNode.diffType];

    if (types.includes('added') && isVersionB) return 'added';
    if (types.includes('removed') && !isVersionB) return 'removed';
    if (types.includes('modified')) return 'modified';
    return 'same';
  }

  private addCompareMarker(postmark: Postmark, index: number, baseColor: string, diffType: string, isVersionB: boolean): void {
    if (!this.map) return;

    let color = baseColor;
    let borderColor = 'white';
    let size = 28;

    if (diffType === 'added') {
      color = '#4caf50';
      borderColor = '#2e7d32';
      size = 34;
    } else if (diffType === 'removed') {
      color = '#f44336';
      borderColor = '#c62828';
      size = 34;
    } else if (diffType === 'modified') {
      color = '#ff9800';
      borderColor = '#e65100';
      size = 32;
    }

    const offset = isVersionB ? 8 : -8;

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid ${borderColor};
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${size * 0.35}px;
          transform: translateX(${offset}px);
        ">${diffType === 'added' ? '+' : diffType === 'removed' ? '−' : index + 1}</div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2 + offset, size / 2]
    });

    const marker = L.marker([postmark.latitude!, postmark.longitude!], { icon });

    const popupContent = `
      <div style="min-width: 180px;">
        <h4 style="margin: 0 0 8px 0; color: ${color};">
          ${postmark.locationName || '未知地点'}
        </h4>
        <p style="margin: 4px 0; font-size: 12px;">
          <strong>方案：</strong>${isVersionB ? 'B' : 'A'}
        </p>
        <p style="margin: 4px 0; font-size: 12px;">
          <strong>类型：</strong>${this.getPostmarkTypeLabel(postmark.type)}
        </p>
        <p style="margin: 4px 0; font-size: 12px;">
          <strong>日期：</strong>${postmark.postmarkDate || '未知'}
        </p>
        <p style="margin: 4px 0; font-size: 12px;">
          <strong>清晰度：</strong>${this.getClarityLabel(postmark.clarity)}
        </p>
        ${postmark.notes ? `<p style="margin: 4px 0; font-size: 12px;"><strong>备注：</strong>${postmark.notes}</p>` : ''}
        ${diffType !== 'same' ? `<p style="margin: 4px 0; font-size: 12px; color: ${color}; font-weight: bold;"><strong>差异：</strong>${this.getDiffTypeLabel(diffType)}</p>` : ''}
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(this.map);
    this.markers.push(marker);
  }

  private renderSingleMap(): void {
    if (!this.map) return;

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

  editLetter(): void {
    this.router.navigate(['/letters', this.letterId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/letters']);
  }
}
