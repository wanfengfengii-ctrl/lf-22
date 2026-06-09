import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Letter } from '../../models/letter.model';
import {
  InferredRoute,
  InferredPostmark,
  InferenceEvidence,
  InferenceResult,
  InferenceSummary,
  EvidenceType
} from '../../models/postal-knowledge.model';
import { RouteInferenceService } from '../../services/route-inference.service';

@Component({
  selector: 'app-route-inference',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="route-inference">
      <div class="header">
        <h3>
          <mat-icon>psychology</mat-icon>
          规则推断邮路
        </h3>
        <button mat-stroked-button color="primary" (click)="runInference()">
          <mat-icon>refresh</mat-icon>
          重新推断
        </button>
      </div>

      <div *ngIf="!inferenceResult" class="empty-state">
        <mat-icon class="empty-icon">auto_awesome</mat-icon>
        <p>点击"重新推断"按钮，基于历史邮路规则分析可能的中转路径</p>
      </div>

      <div *ngIf="inferenceResult">
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title>推断概览</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="label">参考规则数</span>
                <span class="value">{{ inferenceResult.analysisSummary.totalRulesConsidered }}</span>
              </div>
              <div class="summary-item">
                <span class="label">匹配规则</span>
                <span class="value highlight">{{ inferenceResult.analysisSummary.matchingRules }}</span>
              </div>
              <div class="summary-item">
                <span class="label">已知城市</span>
                <span class="value">{{ inferenceResult.analysisSummary.knownTransitCities }}</span>
              </div>
              <div class="summary-item">
                <span class="label">整体可信度</span>
                <span class="value" [style.color]="getConfidenceColor(inferenceResult.analysisSummary.overallConfidence)">
                  {{ inferenceResult.analysisSummary.overallConfidence }}%
                </span>
              </div>
            </div>

            <div *ngIf="inferenceResult.analysisSummary.warnings.length > 0" class="warnings">
              <div class="warning-title">
                <mat-icon>warning</mat-icon>
                注意事项
              </div>
              <ul>
                <li *ngFor="let warning of inferenceResult.analysisSummary.warnings">
                  {{ warning }}
                </li>
              </ul>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="routes-list">
          <h4>推荐方案（按可信度排序）</h4>

          <mat-card
            *ngFor="let route of inferenceResult.routes; let i = index"
            class="route-card"
            [class.selected]="selectedRouteIndex === i"
            (click)="selectRoute(i)"
          >
            <mat-card-header>
              <mat-card-title>
                <span class="route-name">{{ route.name }}</span>
                <span
                  class="confidence-badge"
                  [style.backgroundColor]="getConfidenceColor(route.confidence)"
                >
                  {{ route.confidence }}%
                </span>
              </mat-card-title>
              <mat-card-subtitle>
                {{ getConfidenceLabel(route.confidence) }}
                <span *ngIf="route.totalDurationDays !== null"> · 约 {{ route.totalDurationDays }} 天</span>
                <span *ngIf="route.totalDistanceKm !== null"> · {{ route.totalDistanceKm }} 公里</span>
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content *ngIf="selectedRouteIndex === i">
              <div class="route-visual">
                <div
                  *ngFor="let pm of route.postmarks; let last = last"
                  class="route-node"
                >
                  <div class="node-dot" [class.inferred]="pm.isInferred">
                    <mat-icon *ngIf="pm.type === 'origin'">flight_takeoff</mat-icon>
                    <mat-icon *ngIf="pm.type === 'destination'">flight_land</mat-icon>
                    <mat-icon *ngIf="pm.type === 'transit' && !pm.isInferred">location_on</mat-icon>
                    <mat-icon *ngIf="pm.type === 'transit' && pm.isInferred">help_outline</mat-icon>
                  </div>
                  <div class="node-info">
                    <div class="node-name">
                      {{ pm.locationName }}
                      <span *ngIf="pm.isInferred" class="inferred-tag">推断</span>
                      <span *ngIf="!pm.isInferred && pm.clarity === 'fuzzy'" class="fuzzy-tag">模糊</span>
                    </div>
                    <div class="node-date">
                      {{ pm.postmarkDate || '日期不详' }}
                    </div>
                    <div *ngIf="pm.inferenceReason" class="node-reason">
                      {{ pm.inferenceReason }}
                    </div>
                  </div>
                  <div *ngIf="!last" class="connector"></div>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="evidence-section">
                <h5>
                  <mat-icon>science</mat-icon>
                  推断依据
                </h5>
                <mat-list dense>
                  <mat-list-item *ngFor="let evidence of route.evidences">
                    <span matListItemIcon>
                      <mat-icon [class.supporting]="evidence.supporting" [class.opposing]="!evidence.supporting">
                        {{ evidence.supporting ? 'check_circle' : 'cancel' }}
                      </mat-icon>
                    </span>
                    <span matListItemTitle>{{ evidence.description }}</span>
                    <span matListItemMeta class="evidence-weight">权重 {{ evidence.weight }}</span>
                  </mat-list-item>
                </mat-list>
              </div>

              <div class="action-bar">
                <button mat-button color="primary" (click)="onApplyRoute(route)">
                  <mat-icon>add_circle</mat-icon>
                  应用此方案
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .route-inference {
      width: 100%;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #4e342e;
    }
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      background: rgba(255,248,225,0.5);
      border-radius: 8px;
      border: 2px dashed #d7ccc8;
    }
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #a1887f;
      margin-bottom: 12px;
    }
    .empty-state p {
      margin: 0;
      color: #795548;
    }
    .summary-card {
      margin-bottom: 20px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-item .label {
      display: block;
      font-size: 0.85rem;
      color: #8d6e63;
      margin-bottom: 4px;
    }
    .summary-item .value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #4e342e;
    }
    .summary-item .value.highlight {
      color: #2e7d32;
    }
    .warnings {
      margin-top: 16px;
      padding: 12px;
      background: #fff8e1;
      border-radius: 6px;
    }
    .warning-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: #e65100;
      margin-bottom: 8px;
    }
    .warnings ul {
      margin: 0;
      padding-left: 20px;
      color: #e65100;
    }
    .routes-list h4 {
      margin: 0 0 12px 0;
      color: #5d4037;
    }
    .route-card {
      margin-bottom: 12px;
      cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .route-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .route-card.selected {
      border: 2px solid #795548;
    }
    .route-name {
      font-size: 1rem;
    }
    .confidence-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      color: white;
      font-size: 0.8rem;
      font-weight: 600;
      margin-left: 12px;
    }
    .route-visual {
      padding: 16px 0;
    }
    .route-node {
      display: flex;
      align-items: flex-start;
      position: relative;
      padding-bottom: 12px;
    }
    .node-dot {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #795548;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      z-index: 1;
    }
    .node-dot mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .node-dot.inferred {
      background: #9e9e9e;
      border: 2px dashed #757575;
      background: white;
      color: #757575;
    }
    .node-info {
      margin-left: 12px;
      flex: 1;
    }
    .node-name {
      font-weight: 600;
      color: #3e2723;
    }
    .inferred-tag {
      display: inline-block;
      padding: 1px 6px;
      background: #e0e0e0;
      color: #616161;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-left: 6px;
    }
    .fuzzy-tag {
      display: inline-block;
      padding: 1px 6px;
      background: #ffe0b2;
      color: #e65100;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-left: 6px;
    }
    .node-date {
      font-size: 0.85rem;
      color: #8d6e63;
      margin-top: 2px;
    }
    .node-reason {
      font-size: 0.8rem;
      color: #9e9e9e;
      margin-top: 4px;
      font-style: italic;
    }
    .connector {
      position: absolute;
      left: 17px;
      top: 36px;
      width: 2px;
      height: calc(100% - 24px);
      background: #d7ccc8;
    }
    .evidence-section {
      margin-top: 12px;
    }
    .evidence-section h5 {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 12px 0 8px 0;
      color: #5d4037;
      font-size: 0.95rem;
    }
    .evidence-weight {
      font-size: 0.8rem;
      color: #9e9e9e;
    }
    .supporting {
      color: #4caf50;
    }
    .opposing {
      color: #f44336;
    }
    .action-bar {
      margin-top: 16px;
      text-align: right;
    }
    @media (max-width: 600px) {
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class RouteInferenceComponent implements OnInit, OnChanges {
  @Input() letter!: Letter;
  @Input() versionId?: string;
  @Output() applyRoute = new EventEmitter<InferredRoute>();

  inferenceResult: InferenceResult | null = null;
  selectedRouteIndex = 0;

  constructor(private inferenceService: RouteInferenceService) {}

  ngOnInit(): void {
    this.runInference();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['letter'] || changes['versionId']) {
      this.runInference();
    }
  }

  runInference(): void {
    if (!this.letter) return;
    this.inferenceResult = this.inferenceService.inferRoute(this.letter, this.versionId);
    this.selectedRouteIndex = 0;
  }

  selectRoute(index: number): void {
    this.selectedRouteIndex = index;
  }

  getConfidenceLabel(confidence: number): string {
    return this.inferenceService.getConfidenceLabel(confidence);
  }

  getConfidenceColor(confidence: number): string {
    return this.inferenceService.getConfidenceColor(confidence);
  }

  onApplyRoute(route: InferredRoute): void {
    this.applyRoute.emit(route);
  }
}
