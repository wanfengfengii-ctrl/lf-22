import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  PostalRouteRule,
  TransitCity,
  RestrictedArea,
  TransitDuration,
  TransportType,
  TransitRole,
  RestrictionType,
  AreaType
} from '../../models/postal-knowledge.model';
import { PostalKnowledgeService } from '../../services/postal-knowledge.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import {
  KnowledgeEditDialogComponent,
  KnowledgeEntityType
} from '../knowledge-edit-dialog/knowledge-edit-dialog.component';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="knowledge-base">
      <div class="header">
        <div>
          <h2>历史邮路知识库</h2>
          <p class="subtitle">管理邮政线路规则、中转城市、禁限寄区域和运输时长数据</p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-number">{{ rules.length }}</span>
            <span class="stat-label">邮路规则</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ cities.length }}</span>
            <span class="stat-label">中转城市</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ restrictedAreas.length }}</span>
            <span class="stat-label">禁限区域</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ durations.length }}</span>
            <span class="stat-label">时长记录</span>
          </div>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="邮路规则">
          <div class="tab-content">
            <div class="tab-header">
              <div class="search-box">
                <mat-icon>search</mat-icon>
                <input
                  type="text"
                  placeholder="搜索规则名称、起终点..."
                  [(ngModel)]="ruleSearchText"
                  (input)="filterRules()"
                />
              </div>
              <button mat-raised-button color="primary" (click)="openRuleDialog()">
                <mat-icon>add</mat-icon>
                新增规则
              </button>
            </div>

            <div class="card-grid" *ngIf="filteredRules.length > 0; else emptyRules">
              <mat-card
                *ngFor="let rule of filteredRules"
                class="entity-card rule-card"
              >
                <mat-card-header>
                  <mat-card-title>{{ rule.name }}</mat-card-title>
                  <mat-card-subtitle>{{ rule.era }}</mat-card-subtitle>
                  <div class="card-actions">
                    <button mat-icon-button (click)="openRuleDialog(rule)" matTooltip="编辑">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteRule(rule)" matTooltip="删除">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </mat-card-header>
                <mat-card-content>
                  <div class="route-display">
                    <span class="city origin">{{ rule.origin }}</span>
                    <mat-icon class="arrow">arrow_forward</mat-icon>
                    <span class="city transit" *ngFor="let city of rule.transitCities">
                      {{ city }}
                      <mat-icon class="arrow">arrow_forward</mat-icon>
                    </span>
                    <span class="city destination">{{ rule.destination }}</span>
                  </div>

                  <div class="card-meta">
                    <span class="meta-item" *ngIf="rule.typicalDurationDays">
                      <mat-icon>schedule</mat-icon>
                      约 {{ rule.typicalDurationDays }} 天
                    </span>
                    <span class="meta-item">
                      <mat-icon>directions</mat-icon>
                      {{ getTransportLabel(rule.transportType) }}
                    </span>
                    <span class="meta-item" *ngIf="rule.frequency">
                      <mat-icon>repeat</mat-icon>
                      {{ rule.frequency }}
                    </span>
                  </div>

                  <p class="card-description" *ngIf="rule.description">
                    {{ rule.description }}
                  </p>

                  <div class="source-tag" *ngIf="rule.source">
                    <mat-icon>book</mat-icon>
                    {{ rule.source }}
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <ng-template #emptyRules>
              <div class="empty-state">
                <mat-icon>route</mat-icon>
                <p>暂无邮路规则数据</p>
                <button mat-raised-button color="primary" (click)="openRuleDialog()">
                  添加第一条规则
                </button>
              </div>
            </ng-template>
          </div>
        </mat-tab>

        <mat-tab label="中转城市">
          <div class="tab-content">
            <div class="tab-header">
              <div class="search-box">
                <mat-icon>search</mat-icon>
                <input
                  type="text"
                  placeholder="搜索城市名称、省份..."
                  [(ngModel)]="citySearchText"
                  (input)="filterCities()"
                />
              </div>
              <button mat-raised-button color="primary" (click)="openCityDialog()">
                <mat-icon>add</mat-icon>
                新增城市
              </button>
            </div>

            <div class="card-grid" *ngIf="filteredCities.length > 0; else emptyCities">
              <mat-card
                *ngFor="let city of filteredCities"
                class="entity-card city-card"
              >
                <mat-card-header>
                  <mat-card-title>{{ city.name }}</mat-card-title>
                  <mat-card-subtitle>
                    {{ city.province ? city.province + ' · ' : '' }}{{ city.era }}
                  </mat-card-subtitle>
                  <div class="card-actions">
                    <button mat-icon-button (click)="openCityDialog(city)" matTooltip="编辑">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteCity(city)" matTooltip="删除">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </mat-card-header>
                <mat-card-content>
                  <div class="importance-badge" [ngClass]="city.importance">
                    {{ getImportanceLabel(city.importance) }}
                  </div>

                  <div class="role-tags">
                    <span
                      class="role-tag"
                      *ngFor="let role of city.roles"
                    >
                      {{ getRoleLabel(role) }}
                    </span>
                  </div>

                  <div class="card-meta" *ngIf="city.latitude && city.longitude">
                    <span class="meta-item">
                      <mat-icon>location_on</mat-icon>
                      {{ city.latitude.toFixed(4) }}, {{ city.longitude.toFixed(4) }}
                    </span>
                  </div>

                  <p class="card-description" *ngIf="city.description">
                    {{ city.description }}
                  </p>

                  <div class="source-tag" *ngIf="city.source">
                    <mat-icon>book</mat-icon>
                    {{ city.source }}
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <ng-template #emptyCities>
              <div class="empty-state">
                <mat-icon>location_city</mat-icon>
                <p>暂无中转城市数据</p>
                <button mat-raised-button color="primary" (click)="openCityDialog()">
                  添加第一个城市
                </button>
              </div>
            </ng-template>
          </div>
        </mat-tab>

        <mat-tab label="禁限寄区域">
          <div class="tab-content">
            <div class="tab-header">
              <div class="search-box">
                <mat-icon>search</mat-icon>
                <input
                  type="text"
                  placeholder="搜索区域名称..."
                  [(ngModel)]="restrictedSearchText"
                  (input)="filterRestrictedAreas()"
                />
              </div>
              <button mat-raised-button color="primary" (click)="openRestrictedDialog()">
                <mat-icon>add</mat-icon>
                新增区域
              </button>
            </div>

            <div class="card-grid" *ngIf="filteredRestrictedAreas.length > 0; else emptyRestricted">
              <mat-card
                *ngFor="let area of filteredRestrictedAreas"
                class="entity-card restricted-card"
              >
                <mat-card-header>
                  <mat-card-title>{{ area.name }}</mat-card-title>
                  <mat-card-subtitle>{{ area.era }}</mat-card-subtitle>
                  <div class="card-actions">
                    <button mat-icon-button (click)="openRestrictedDialog(area)" matTooltip="编辑">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteRestrictedArea(area)" matTooltip="删除">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </mat-card-header>
                <mat-card-content>
                  <div class="restriction-tags">
                    <span class="restriction-badge" [ngClass]="area.restrictionType">
                      {{ getRestrictionTypeLabel(area.restrictionType) }}
                    </span>
                    <span class="area-type-tag">
                      {{ getAreaTypeLabel(area.areaType) }}
                    </span>
                  </div>

                  <div class="period-info" *ngIf="area.startYear || area.endYear">
                    <mat-icon>date_range</mat-icon>
                    {{ area.startYear || '?' }} - {{ area.endYear || '?' }} 年
                  </div>

                  <div class="locations-list">
                    <span class="location-chip" *ngFor="let loc of area.locationNames">
                      {{ loc }}
                    </span>
                  </div>

                  <p class="card-description" *ngIf="area.description">
                    {{ area.description }}
                  </p>

                  <div class="source-tag" *ngIf="area.source">
                    <mat-icon>book</mat-icon>
                    {{ area.source }}
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <ng-template #emptyRestricted>
              <div class="empty-state">
                <mat-icon>block</mat-icon>
                <p>暂无禁限寄区域数据</p>
                <button mat-raised-button color="primary" (click)="openRestrictedDialog()">
                  添加第一个区域
                </button>
              </div>
            </ng-template>
          </div>
        </mat-tab>

        <mat-tab label="运输时长">
          <div class="tab-content">
            <div class="tab-header">
              <div class="search-box">
                <mat-icon>search</mat-icon>
                <input
                  type="text"
                  placeholder="搜索起点或终点城市..."
                  [(ngModel)]="durationSearchText"
                  (input)="filterDurations()"
                />
              </div>
              <button mat-raised-button color="primary" (click)="openDurationDialog()">
                <mat-icon>add</mat-icon>
                新增时长
              </button>
            </div>

            <div class="card-grid" *ngIf="filteredDurations.length > 0; else emptyDurations">
              <mat-card
                *ngFor="let d of filteredDurations"
                class="entity-card duration-card"
              >
                <mat-card-header>
                  <mat-card-title>
                    {{ d.fromCity }}
                    <mat-icon class="route-arrow">arrow_forward</mat-icon>
                    {{ d.toCity }}
                  </mat-card-title>
                  <mat-card-subtitle>{{ d.era }}</mat-card-subtitle>
                  <div class="card-actions">
                    <button mat-icon-button (click)="openDurationDialog(d)" matTooltip="编辑">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteDuration(d)" matTooltip="删除">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </mat-card-header>
                <mat-card-content>
                  <div class="duration-display">
                    <span class="duration-main">{{ d.typicalDays }}</span>
                    <span class="duration-unit">天</span>
                  </div>

                  <div class="duration-range" *ngIf="d.minDays || d.maxDays">
                    范围: {{ d.minDays || '?' }} - {{ d.maxDays || '?' }} 天
                  </div>

                  <div class="card-meta">
                    <span class="meta-item">
                      <mat-icon>directions</mat-icon>
                      {{ getTransportLabel(d.transportType) }}
                    </span>
                  </div>

                  <p class="card-description" *ngIf="d.notes">
                    {{ d.notes }}
                  </p>

                  <div class="source-tag" *ngIf="d.source">
                    <mat-icon>book</mat-icon>
                    {{ d.source }}
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <ng-template #emptyDurations>
              <div class="empty-state">
                <mat-icon>schedule</mat-icon>
                <p>暂无运输时长数据</p>
                <button mat-raised-button color="primary" (click)="openDurationDialog()">
                  添加第一条时长记录
                </button>
              </div>
            </ng-template>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .knowledge-base {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .header h2 {
      margin: 0 0 8px 0;
      color: #3e2723;
    }
    .subtitle {
      margin: 0;
      color: #6d4c41;
      font-size: 0.9rem;
    }
    .header-stats {
      display: flex;
      gap: 24px;
    }
    .stat-item {
      text-align: center;
      background: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-number {
      display: block;
      font-size: 1.75rem;
      font-weight: bold;
      color: #5d4037;
    }
    .stat-label {
      font-size: 0.8rem;
      color: #8d6e63;
    }
    .tab-content {
      padding: 16px 0;
    }
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 16px;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      padding: 8px 16px;
      border-radius: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      flex: 1;
      max-width: 400px;
    }
    .search-box mat-icon {
      color: #9e9e9e;
    }
    .search-box input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 0.95rem;
      background: transparent;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .entity-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .entity-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .entity-card mat-card-header {
      padding-bottom: 8px;
    }
    .entity-card .card-actions {
      margin-left: auto;
      display: flex;
      gap: 4px;
    }
    .entity-card .card-actions button {
      width: 36px;
      height: 36px;
    }
    .route-display {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin: 8px 0;
    }
    .route-display .city {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .route-display .origin {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .route-display .transit {
      background: #fff3e0;
      color: #e65100;
    }
    .route-display .destination {
      background: #ffebee;
      color: #c62828;
    }
    .route-display .arrow {
      font-size: 18px;
      color: #bdbdbd;
      width: 18px;
      height: 18px;
    }
    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 8px 0;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: #757575;
    }
    .meta-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .card-description {
      font-size: 0.85rem;
      color: #666;
      margin: 8px 0;
      line-height: 1.5;
    }
    .source-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #6d4c41;
      background: #efebe9;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .source-tag mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .importance-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .importance-badge.primary {
      background: #e3f2fd;
      color: #1565c0;
    }
    .importance-badge.secondary {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    .importance-badge.tertiary {
      background: #f5f5f5;
      color: #616161;
    }
    .role-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }
    .role-tag {
      padding: 2px 8px;
      background: #eceff1;
      color: #455a64;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .restriction-tags {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .restriction-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .restriction-badge.prohibited {
      background: #ffebee;
      color: #c62828;
    }
    .restriction-badge.restricted {
      background: #fff3e0;
      color: #e65100;
    }
    .restriction-badge.suspended {
      background: #e3f2fd;
      color: #1565c0;
    }
    .area-type-tag {
      padding: 3px 10px;
      background: #f5f5f5;
      color: #616161;
      border-radius: 12px;
      font-size: 0.75rem;
    }
    .period-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #666;
      margin: 8px 0;
    }
    .period-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .locations-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0;
    }
    .location-chip {
      padding: 2px 10px;
      background: #ffebee;
      color: #c62828;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    .duration-display {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin: 8px 0;
    }
    .duration-main {
      font-size: 2.5rem;
      font-weight: bold;
      color: #5d4037;
    }
    .duration-unit {
      font-size: 1rem;
      color: #8d6e63;
    }
    .duration-range {
      font-size: 0.85rem;
      color: #757575;
      margin-bottom: 8px;
    }
    .route-arrow {
      font-size: 20px;
      vertical-align: middle;
      margin: 0 4px;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: rgba(255,248,225,0.5);
      border-radius: 12px;
      border: 2px dashed #d7ccc8;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #a1887f;
      margin-bottom: 12px;
    }
    .empty-state p {
      margin: 0 0 16px 0;
      color: #795548;
    }
    :host ::ng-deep .mat-mdc-tab-body-wrapper {
      min-height: 500px;
    }
    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 16px;
      }
      .header-stats {
        width: 100%;
        justify-content: space-around;
      }
      .tab-header {
        flex-direction: column;
        align-items: stretch;
      }
      .search-box {
        max-width: none;
      }
      .card-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class KnowledgeBaseComponent implements OnInit {
  rules: PostalRouteRule[] = [];
  cities: TransitCity[] = [];
  restrictedAreas: RestrictedArea[] = [];
  durations: TransitDuration[] = [];

  filteredRules: PostalRouteRule[] = [];
  filteredCities: TransitCity[] = [];
  filteredRestrictedAreas: RestrictedArea[] = [];
  filteredDurations: TransitDuration[] = [];

  ruleSearchText = '';
  citySearchText = '';
  restrictedSearchText = '';
  durationSearchText = '';

  constructor(
    private knowledgeService: PostalKnowledgeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.rules = this.knowledgeService.getRules();
    this.cities = this.knowledgeService.getCities();
    this.restrictedAreas = this.knowledgeService.getRestrictedAreas();
    this.durations = this.knowledgeService.getDurations();

    this.filterRules();
    this.filterCities();
    this.filterRestrictedAreas();
    this.filterDurations();
  }

  filterRules(): void {
    if (!this.ruleSearchText.trim()) {
      this.filteredRules = [...this.rules];
      return;
    }
    const query = this.ruleSearchText.toLowerCase();
    this.filteredRules = this.rules.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.origin.toLowerCase().includes(query) ||
      r.destination.toLowerCase().includes(query) ||
      r.transitCities.some(c => c.toLowerCase().includes(query))
    );
  }

  filterCities(): void {
    if (!this.citySearchText.trim()) {
      this.filteredCities = [...this.cities];
      return;
    }
    const query = this.citySearchText.toLowerCase();
    this.filteredCities = this.cities.filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.province && c.province.toLowerCase().includes(query))
    );
  }

  filterRestrictedAreas(): void {
    if (!this.restrictedSearchText.trim()) {
      this.filteredRestrictedAreas = [...this.restrictedAreas];
      return;
    }
    const query = this.restrictedSearchText.toLowerCase();
    this.filteredRestrictedAreas = this.restrictedAreas.filter(a =>
      a.name.toLowerCase().includes(query) ||
      a.locationNames.some(l => l.toLowerCase().includes(query))
    );
  }

  filterDurations(): void {
    if (!this.durationSearchText.trim()) {
      this.filteredDurations = [...this.durations];
      return;
    }
    const query = this.durationSearchText.toLowerCase();
    this.filteredDurations = this.durations.filter(d =>
      d.fromCity.toLowerCase().includes(query) ||
      d.toCity.toLowerCase().includes(query)
    );
  }

  getTransportLabel(type: TransportType): string {
    const labels: Record<TransportType, string> = {
      land: '陆路',
      water: '水路',
      rail: '铁路',
      air: '航空',
      mixed: '联运'
    };
    return labels[type] || type;
  }

  getImportanceLabel(importance: string): string {
    const labels: Record<string, string> = {
      primary: '主要枢纽',
      secondary: '次要城市',
      tertiary: '三级站点'
    };
    return labels[importance] || importance;
  }

  getRoleLabel(role: TransitRole): string {
    const labels: Record<TransitRole, string> = {
      hub: '邮政枢纽',
      border: '边境',
      port: '港口',
      railway_station: '火车站',
      customs: '海关',
      relay: '驿站'
    };
    return labels[role] || role;
  }

  getRestrictionTypeLabel(type: RestrictionType): string {
    const labels: Record<RestrictionType, string> = {
      prohibited: '禁止',
      restricted: '限制',
      suspended: '暂停'
    };
    return labels[type] || type;
  }

  getAreaTypeLabel(type: AreaType): string {
    const labels: Record<AreaType, string> = {
      city: '城市',
      region: '地区',
      border: '边境',
      route: '路线'
    };
    return labels[type] || type;
  }

  openRuleDialog(rule?: PostalRouteRule): void {
    this.openEditDialog('rule', rule);
  }

  openCityDialog(city?: TransitCity): void {
    this.openEditDialog('city', city);
  }

  openRestrictedDialog(area?: RestrictedArea): void {
    this.openEditDialog('restricted', area);
  }

  openDurationDialog(duration?: TransitDuration): void {
    this.openEditDialog('duration', duration);
  }

  private openEditDialog(type: KnowledgeEntityType, entity?: any): void {
    const dialogRef = this.dialog.open(KnowledgeEditDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        type,
        entity,
        cities: this.cities
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.isEdit && entity) {
          this.updateEntity(type, entity.id, result);
        } else {
          this.addEntity(type, result);
        }
      }
    });
  }

  private addEntity(type: KnowledgeEntityType, data: any): void {
    switch (type) {
      case 'rule':
        this.knowledgeService.addRule(data);
        break;
      case 'city':
        this.knowledgeService.addCity(data);
        break;
      case 'restricted':
        this.knowledgeService.addRestrictedArea(data);
        break;
      case 'duration':
        this.knowledgeService.addDuration(data);
        break;
    }
    this.loadData();
    this.snackBar.open('添加成功', '关闭', { duration: 2000 });
  }

  private updateEntity(type: KnowledgeEntityType, id: string, data: any): void {
    switch (type) {
      case 'rule':
        this.knowledgeService.updateRule(id, data);
        break;
      case 'city':
        this.knowledgeService.updateCity(id, data);
        break;
      case 'restricted':
        this.knowledgeService.updateRestrictedArea(id, data);
        break;
      case 'duration':
        this.knowledgeService.updateDuration(id, data);
        break;
    }
    this.loadData();
    this.snackBar.open('保存成功', '关闭', { duration: 2000 });
  }

  deleteRule(rule: PostalRouteRule): void {
    this.deleteEntity('rule', rule.id, rule.name);
  }

  deleteCity(city: TransitCity): void {
    this.deleteEntity('city', city.id, city.name);
  }

  deleteRestrictedArea(area: RestrictedArea): void {
    this.deleteEntity('restricted', area.id, area.name);
  }

  deleteDuration(duration: TransitDuration): void {
    this.deleteEntity('duration', duration.id, `${duration.fromCity} → ${duration.toCity}`);
  }

  private deleteEntity(type: KnowledgeEntityType, id: string, displayName: string): void {
    const typeLabels: Record<KnowledgeEntityType, string> = {
      rule: '规则',
      city: '城市',
      restricted: '区域',
      duration: '时长记录'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '确认删除',
        message: `确定要删除${typeLabels[type]}「${displayName}」吗？此操作不可恢复。`,
        confirmText: '删除',
        cancelText: '取消'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let success = false;
        switch (type) {
          case 'rule':
            success = this.knowledgeService.deleteRule(id);
            break;
          case 'city':
            success = this.knowledgeService.deleteCity(id);
            break;
          case 'restricted':
            success = this.knowledgeService.deleteRestrictedArea(id);
            break;
          case 'duration':
            success = this.knowledgeService.deleteDuration(id);
            break;
        }
        if (success) {
          this.loadData();
          this.snackBar.open('删除成功', '关闭', { duration: 2000 });
        }
      }
    });
  }
}
