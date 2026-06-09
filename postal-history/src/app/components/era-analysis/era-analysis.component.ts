import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  PostalKnowledgeService
} from '../../services/postal-knowledge.service';
import {
  EraNetworkAnalysis,
  CityEraComparison,
  NetworkNode,
  NetworkEdge,
  TimelineDataPoint
} from '../../models/postal-knowledge.model';
import { LabelService } from '../../shared/services/label.service';
import { StatisticsService } from '../../shared/services/statistics.service';

@Component({
  selector: 'app-era-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSliderModule,
    MatTooltipModule
  ],
  template: `
    <div class="era-analysis">
      <div class="header">
        <div>
          <h2>时代切片邮政网络分析</h2>
          <p class="subtitle">按年代区间筛选邮路数据，分析历史时期的邮政网络演变</p>
        </div>
      </div>

      <div class="filter-section">
        <mat-card class="filter-card">
          <mat-card-header>
            <mat-card-title>年代筛选</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="preset-eras">
              <button
                *ngFor="let era of presetEras"
                mat-raised-button
                [class.active]="selectedPreset === era.name"
                (click)="selectPresetEra(era)"
              >
                {{ era.name }}
              </button>
              <button
                mat-stroked-button
                [class.active]="selectedPreset === 'custom'"
                (click)="selectedPreset = 'custom'"
              >
                自定义
              </button>
            </div>

            <div class="year-range">
              <div class="year-input">
                <label>起始年份</label>
                <input
                  type="number"
                  [(ngModel)]="startYear"
                  (change)="onYearRangeChange()"
                  [min]="yearRange.min"
                  [max]="yearRange.max"
                />
              </div>
              <mat-icon class="arrow">arrow_forward</mat-icon>
              <div class="year-input">
                <label>结束年份</label>
                <input
                  type="number"
                  [(ngModel)]="endYear"
                  (change)="onYearRangeChange()"
                  [min]="yearRange.min"
                  [max]="yearRange.max"
                />
              </div>
            </div>

            <div class="slider-container">
              <span class="year-label">{{ yearRange.min }}</span>
              <div class="dual-slider">
                <input
                  type="range"
                  class="slider start"
                  [min]="yearRange.min"
                  [max]="yearRange.max"
                  [(ngModel)]="startYear"
                  (input)="onYearRangeChange()"
                />
                <input
                  type="range"
                  class="slider end"
                  [min]="yearRange.min"
                  [max]="yearRange.max"
                  [(ngModel)]="endYear"
                  (input)="onYearRangeChange()"
                />
              </div>
              <span class="year-label">{{ yearRange.max }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="stats-row">
          <mat-card class="stat-card">
            <div class="stat-icon route-icon">
              <mat-icon>route</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ analysis?.totalRoutes || 0 }}</span>
              <span class="stat-label">邮路规则</span>
            </div>
          </mat-card>
          <mat-card class="stat-card">
            <div class="stat-icon city-icon">
              <mat-icon>location_city</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ analysis?.totalCities || 0 }}</span>
              <span class="stat-label">连通城市</span>
            </div>
          </mat-card>
          <mat-card class="stat-card">
            <div class="stat-icon duration-icon">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ analysis?.averageDuration || '-' }}</span>
              <span class="stat-label">平均运输时长(天)</span>
            </div>
          </mat-card>
          <mat-card class="stat-card">
            <div class="stat-icon restrict-icon">
              <mat-icon>block</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ analysis?.restrictedAreas?.length || 0 }}</span>
              <span class="stat-label">禁限区域</span>
            </div>
          </mat-card>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="网络图谱">
          <div class="tab-content">
            <div class="network-container">
              <div class="network-graph">
                <svg viewBox="0 0 800 500" class="graph-svg">
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#9e9e9e" />
                    </marker>
                  </defs>
                  
                  <g class="edges">
                    <line
                      *ngFor="let edge of displayEdges; let i = index"
                      [attr.x1]="getNodePosition(edge.from)?.x"
                      [attr.y1]="getNodePosition(edge.from)?.y"
                      [attr.x2]="getNodePosition(edge.to)?.x"
                      [attr.y2]="getNodePosition(edge.to)?.y"
                      [class.trunk]="edge.ruleCount >= 2"
                      [attr.stroke-width]="getEdgeWidth(edge)"
                      stroke="#9e9e9e"
                      stroke-opacity="0.6"
                    />
                  </g>

                  <g class="nodes">
                    <g
                      *ngFor="let node of analysis?.nodes"
                      [attr.transform]="'translate(' + (getNodePosition(node.name)?.x || 0) + ',' + (getNodePosition(node.name)?.y || 0) + ')'"
                      class="node-group"
                      (mouseenter)="hoveredNode = node.name"
                      (mouseleave)="hoveredNode = null"
                    >
                      <circle
                        [attr.r]="getNodeRadius(node)"
                        [class.primary]="node.importance === 'primary'"
                        [class.secondary]="node.importance === 'secondary'"
                        [class.tertiary]="node.importance === 'tertiary'"
                        [class.hovered]="hoveredNode === node.name"
                        fill="#fff"
                        stroke-width="2"
                      />
                      <text
                        y="4"
                        text-anchor="middle"
                        class="node-label"
                        [class.primary-label]="node.importance === 'primary'"
                      >
                        {{ node.name }}
                      </text>
                    </g>
                  </g>
                </svg>

                <div class="graph-legend">
                  <div class="legend-item">
                    <span class="legend-dot primary"></span>
                    <span>主要枢纽</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-dot secondary"></span>
                    <span>次要城市</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-dot tertiary"></span>
                    <span>三级站点</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-line thick"></span>
                    <span>干线邮路</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-line thin"></span>
                    <span>普通邮路</span>
                  </div>
                </div>
              </div>

              <div class="node-tooltip" *ngIf="hoveredNode"
                   [style.left]="tooltipPosition.x + 'px'"
                   [style.top]="tooltipPosition.y + 'px'">
                <div class="tooltip-title">{{ hoveredNodeData?.name }}</div>
                <div class="tooltip-row">
                  <span>重要性:</span>
                  <span>{{ labelService.getImportanceLabel(hoveredNodeData?.importance) }}</span>
                </div>
                <div class="tooltip-row">
                  <span>连接数:</span>
                  <span>{{ hoveredNodeData?.connectionCount || 0 }}</span>
                </div>
                <div class="tooltip-row">
                  <span>角色:</span>
                  <span>
                    <mat-chip *ngFor="let role of hoveredNodeData?.roles" class="role-chip">
                      {{ labelService.getRoleLabel(role) }}
                    </mat-chip>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="核心枢纽与干线">
          <div class="tab-content">
            <div class="two-column">
              <div class="column">
                <h3>核心枢纽城市</h3>
                <mat-card
                  *ngFor="let city of analysis?.hubCities"
                  class="hub-card"
                >
                  <div class="hub-header">
                    <div class="hub-name">{{ city.name }}</div>
                    <div class="hub-conn">
                      <mat-icon>swap_horiz</mat-icon>
                      {{ city.connectionCount }} 条连接
                    </div>
                  </div>
                  <div class="hub-meta">
                    <span class="province" *ngIf="city.province">
                      <mat-icon>location_on</mat-icon>
                      {{ city.province }}
                    </span>
                  </div>
                  <div class="role-tags">
                    <span class="role-tag" *ngFor="let role of city.roles">
                      {{ labelService.getRoleLabel(role) }}
                    </span>
                  </div>
                  <p class="hub-desc" *ngIf="city.description">
                    {{ city.description }}
                  </p>
                </mat-card>
              </div>

              <div class="column">
                <h3>常见干线邮路</h3>
                <mat-card
                  *ngFor="let route of analysis?.trunkRoutes"
                  class="trunk-card"
                >
                  <div class="trunk-route">
                    <span class="city from">{{ route.from }}</span>
                    <mat-icon class="route-arrow">arrow_forward</mat-icon>
                    <span class="city to">{{ route.to }}</span>
                  </div>
                  <div class="trunk-meta">
                    <span class="meta-item">
                      <mat-icon>route</mat-icon>
                      {{ route.ruleCount }} 条规则
                    </span>
                    <span class="meta-item" *ngIf="route.typicalDays">
                      <mat-icon>schedule</mat-icon>
                      {{ route.typicalDays }} 天
                    </span>
                    <span class="meta-item">
                      <mat-icon>directions</mat-icon>
                      {{ labelService.getTransportLabel(route.transportType) }}
                    </span>
                  </div>
                  <div class="route-names" *ngIf="route.routeNames.length > 0">
                    <span class="route-name" *ngFor="let name of route.routeNames">
                      {{ name }}
                    </span>
                  </div>
                </mat-card>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="运输方式与时长">
          <div class="tab-content">
            <div class="transport-analysis">
              <h3>各运输方式平均时长</h3>
              <div class="transport-cards">
                <mat-card
                  *ngFor="let item of analysis?.durationByTransport"
                  class="transport-card"
                >
                  <div class="transport-icon">
                    <mat-icon>{{ labelService.getTransportIcon(item.type) }}</mat-icon>
                  </div>
                  <div class="transport-info">
                    <div class="transport-name">{{ labelService.getTransportLabel(item.type) }}</div>
                    <div class="transport-days">{{ item.avgDays }} <span>天</span></div>
                    <div class="transport-count">{{ item.count }} 条记录</div>
                  </div>
                </mat-card>
              </div>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="禁限寄影响">
          <div class="tab-content">
            <div class="restricted-section">
              <h3>本时期禁限寄区域</h3>
              <div class="card-grid" *ngIf="hasRestrictedAreas; else noRestricted">
                <mat-card
                  *ngFor="let area of analysis?.restrictedAreas"
                  class="restricted-card"
                >
                  <mat-card-header>
                    <mat-card-title>{{ area.name }}</mat-card-title>
                    <mat-card-subtitle>{{ area.era }}</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="restriction-tags">
                      <span class="restriction-badge" [ngClass]="area.restrictionType">
                        {{ labelService.getRestrictionLabel(area.restrictionType) }}
                      </span>
                      <span class="area-type-tag">
                        {{ labelService.getAreaLabel(area.areaType) }}
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
                  </mat-card-content>
                </mat-card>
              </div>
              <ng-template #noRestricted>
                <div class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <p>该时期无禁限寄区域记录</p>
                </div>
              </ng-template>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="城市角色对比">
          <div class="tab-content">
            <div class="comparison-section">
              <div class="comparison-header">
                <h3>城市跨时代角色对比</h3>
                <div class="city-selector">
                  <mat-form-field>
                    <mat-label>选择城市</mat-label>
                    <mat-select [(ngModel)]="selectedCityForCompare" (selectionChange)="runComparison()">
                      <mat-option *ngFor="let city of allCities" [value]="city">
                        {{ city }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>

              <div class="comparison-body" *ngIf="cityComparison; else noComparison">
                <div class="comparison-header-info">
                  <h4>{{ cityComparison.cityName }}</h4>
                  <div class="change-badge" [ngClass]="cityComparison.importanceChange">
                    <mat-icon *ngIf="cityComparison.importanceChange === 'up'">trending_up</mat-icon>
                    <mat-icon *ngIf="cityComparison.importanceChange === 'down'">trending_down</mat-icon>
                    <mat-icon *ngIf="cityComparison.importanceChange === 'stable'">drag_handle</mat-icon>
                    {{ labelService.getChangeLabel(cityComparison.importanceChange) }}
                  </div>
                </div>

                <div class="era-compare-cards">
                  <mat-card *ngFor="let era of cityComparison.eras" class="era-compare-card">
                    <mat-card-header>
                      <mat-card-title>{{ era.eraLabel }}</mat-card-title>
                      <mat-card-subtitle>
                        {{ era.startYear || '?' }} - {{ era.endYear || '?' }} 年
                      </mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="compare-importance">
                        <span class="label">重要性:</span>
                        <span class="value">{{ labelService.getImportanceLabel(era.importance) }}</span>
                      </div>
                      <div class="compare-stats">
                        <div class="stat">
                          <span class="stat-val">{{ era.connectionCount }}</span>
                          <span class="stat-lbl">总连接</span>
                        </div>
                        <div class="stat">
                          <span class="stat-val">{{ era.outgoingRoutes }}</span>
                          <span class="stat-lbl">出发</span>
                        </div>
                        <div class="stat">
                          <span class="stat-val">{{ era.incomingRoutes }}</span>
                          <span class="stat-lbl">到达</span>
                        </div>
                        <div class="stat">
                          <span class="stat-val">{{ era.avgDuration || '-' }}</span>
                          <span class="stat-lbl">均时(天)</span>
                        </div>
                      </div>
                      <div class="compare-roles">
                        <span class="role-tag" *ngFor="let role of era.roles">
                          {{ labelService.getRoleLabel(role) }}
                        </span>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>

                <div class="role-changes" *ngIf="cityComparison.roleChanges.length > 0">
                  <h5>角色变化</h5>
                  <ul>
                    <li *ngFor="let change of cityComparison.roleChanges">{{ change }}</li>
                  </ul>
                </div>
              </div>

              <ng-template #noComparison>
                <div class="empty-state">
                  <mat-icon>compare_arrows</mat-icon>
                  <p>请选择一个城市进行跨时代对比分析</p>
                </div>
              </ng-template>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="历史演变">
          <div class="tab-content">
            <div class="timeline-section">
              <h3>邮政网络历史演变趋势</h3>
              <div class="timeline-chart">
                <svg viewBox="0 0 900 300" class="timeline-svg">
                  <g class="grid-lines">
                    <line
                      *ngFor="let y of gridLines"
                      [attr.x1]="60"
                      [attr.x2]="880"
                      [attr.y1]="y"
                      [attr.y2]="y"
                      stroke="#e0e0e0"
                      stroke-dasharray="4,4"
                    />
                  </g>
                  
                  <g class="y-axis">
                    <text *ngFor="let label of yAxisLabels; let i = index"
                          [attr.x]="50"
                          [attr.y]="gridLines[i] + 4"
                          text-anchor="end"
                          class="axis-label">
                      {{ label }}
                    </text>
                  </g>

                  <g class="x-axis">
                    <text *ngFor="let point of timelineData; let i = index"
                          [attr.x]="getXPosition(i)"
                          [attr.y]="280"
                          text-anchor="middle"
                          class="axis-label">
                      {{ point.year }}s
                    </text>
                  </g>

                  <polyline
                    *ngIf="timelineData.length > 0"
                    [attr.points]="routeLinePoints"
                    fill="none"
                    stroke="#1976d2"
                    stroke-width="2"
                  />
                  <circle
                    *ngFor="let point of timelineData; let i = index"
                    [attr.cx]="getXPosition(i)"
                    [attr.cy]="getYPosition(point.routeCount, maxRouteCount)"
                    r="4"
                    fill="#1976d2"
                    class="data-point"
                    [matTooltip]="point.year + '年代: ' + point.routeCount + ' 条邮路'"
                  />

                  <polyline
                    *ngIf="timelineData.length > 0"
                    [attr.points]="cityLinePoints"
                    fill="none"
                    stroke="#388e3c"
                    stroke-width="2"
                    stroke-dasharray="5,5"
                  />
                  <circle
                    *ngFor="let point of timelineData; let i = index"
                    [attr.cx]="getXPosition(i)"
                    [attr.cy]="getYPosition(point.cityCount, maxCityCount)"
                    r="4"
                    fill="#388e3c"
                    class="data-point"
                    [matTooltip]="point.year + '年代: ' + point.cityCount + ' 个城市'"
                  />
                </svg>

                <div class="chart-legend">
                  <div class="legend-item">
                    <span class="legend-line route-line"></span>
                    <span>邮路数量</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-line city-line"></span>
                    <span>城市数量</span>
                  </div>
                </div>
              </div>

              <div class="timeline-table">
                <h4>各年代详细数据</h4>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>年代</th>
                      <th>邮路数</th>
                      <th>城市数</th>
                      <th>平均时长(天)</th>
                      <th>禁限区域</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let point of timelineData">
                      <td>{{ point.year }}s</td>
                      <td>{{ point.routeCount }}</td>
                      <td>{{ point.cityCount }}</td>
                      <td>{{ point.avgDuration || '-' }}</td>
                      <td>{{ point.restrictedAreaCount }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .era-analysis {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      margin-bottom: 20px;
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
    .filter-section {
      margin-bottom: 24px;
    }
    .filter-card {
      margin-bottom: 16px;
    }
    .filter-card mat-card-header {
      padding-bottom: 8px;
    }
    .preset-eras {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    .preset-eras button.active {
      background: #5d4037;
      color: white;
    }
    .year-range {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .year-input {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .year-input label {
      font-size: 0.8rem;
      color: #666;
    }
    .year-input input {
      width: 100px;
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 1rem;
    }
    .arrow {
      color: #999;
    }
    .slider-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .year-label {
      font-size: 0.85rem;
      color: #666;
      min-width: 40px;
    }
    .dual-slider {
      position: relative;
      flex: 1;
      height: 40px;
    }
    .dual-slider .slider {
      position: absolute;
      width: 100%;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      -webkit-appearance: none;
      appearance: none;
      height: 4px;
      background: transparent;
    }
    .dual-slider .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #5d4037;
      cursor: pointer;
      pointer-events: all;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .dual-slider .slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #5d4037;
      cursor: pointer;
      pointer-events: all;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .dual-slider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 4px;
      background: #ddd;
      transform: translateY(-50%);
      border-radius: 2px;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: white;
    }
    .route-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
    .city-icon { background: linear-gradient(135deg, #f093fb, #f5576c); }
    .duration-icon { background: linear-gradient(135deg, #4facfe, #00f2fe); }
    .restrict-icon { background: linear-gradient(135deg, #fa709a, #fee140); }
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    .stat-number {
      font-size: 1.75rem;
      font-weight: bold;
      color: #3e2723;
    }
    .stat-label {
      font-size: 0.8rem;
      color: #8d6e63;
    }
    .tab-content {
      padding: 16px 0;
    }
    .network-container {
      position: relative;
    }
    .network-graph {
      position: relative;
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .graph-svg {
      width: 100%;
      height: 500px;
    }
    .node-group {
      cursor: pointer;
    }
    .node-group circle.primary { stroke: #1565c0; }
    .node-group circle.secondary { stroke: #7b1fa2; }
    .node-group circle.tertiary { stroke: #616161; }
    .node-group circle.hovered {
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
    }
    .node-label {
      font-size: 11px;
      fill: #333;
      pointer-events: none;
    }
    .node-label.primary-label {
      font-weight: bold;
      font-size: 12px;
    }
    line.trunk {
      stroke: #1565c0 !important;
      stroke-opacity: 0.8 !important;
    }
    .graph-legend {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #666;
    }
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid;
      background: white;
    }
    .legend-dot.primary { border-color: #1565c0; }
    .legend-dot.secondary { border-color: #7b1fa2; }
    .legend-dot.tertiary { border-color: #616161; }
    .legend-line {
      width: 20px;
      height: 3px;
      background: #9e9e9e;
      border-radius: 2px;
    }
    .legend-line.thick { background: #1565c0; height: 4px; }
    .legend-line.thin { background: #9e9e9e; }
    .legend-line.route-line { background: #1976d2; }
    .legend-line.city-line { background: #388e3c; }
    .node-tooltip {
      position: absolute;
      background: rgba(0,0,0,0.85);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      pointer-events: none;
      z-index: 100;
      min-width: 180px;
    }
    .tooltip-title {
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 1rem;
    }
    .tooltip-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .role-chip {
      font-size: 0.7rem !important;
      padding: 2px 6px;
      margin: 2px;
    }
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .column h3 {
      margin: 0 0 16px 0;
      color: #5d4037;
    }
    .hub-card {
      margin-bottom: 12px;
    }
    .hub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .hub-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #3e2723;
    }
    .hub-conn {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: #1565c0;
    }
    .hub-conn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .hub-meta {
      margin-bottom: 8px;
    }
    .province {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: #666;
    }
    .province mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .hub-desc {
      font-size: 0.85rem;
      color: #666;
      margin: 8px 0 0 0;
      line-height: 1.5;
    }
    .role-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .role-tag {
      padding: 2px 8px;
      background: #eceff1;
      color: #455a64;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .trunk-card {
      margin-bottom: 12px;
    }
    .trunk-route {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 600;
      color: #3e2723;
    }
    .trunk-route .city {
      padding: 4px 10px;
      border-radius: 12px;
    }
    .trunk-route .from {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .trunk-route .to {
      background: #ffebee;
      color: #c62828;
    }
    .route-arrow {
      font-size: 20px;
      color: #bdbdbd;
    }
    .trunk-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 8px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: #666;
    }
    .meta-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .route-names {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .route-name {
      font-size: 0.75rem;
      color: #8d6e63;
      background: #efebe9;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .transport-analysis h3 {
      margin: 0 0 16px 0;
      color: #5d4037;
    }
    .transport-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .transport-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    .transport-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .transport-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
    }
    .transport-info {
      flex: 1;
    }
    .transport-name {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 4px;
    }
    .transport-days {
      font-size: 1.75rem;
      font-weight: bold;
      color: #3e2723;
    }
    .transport-days span {
      font-size: 0.9rem;
      font-weight: normal;
      color: #8d6e63;
    }
    .transport-count {
      font-size: 0.75rem;
      color: #999;
      margin-top: 4px;
    }
    .restricted-section h3 {
      margin: 0 0 16px 0;
      color: #5d4037;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
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
    .card-description {
      font-size: 0.85rem;
      color: #666;
      margin: 8px 0;
      line-height: 1.5;
    }
    .comparison-section h3 {
      margin: 0 0 16px 0;
      color: #5d4037;
    }
    .comparison-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .city-selector mat-form-field {
      width: 200px;
    }
    .comparison-header-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .comparison-header-info h4 {
      margin: 0;
      font-size: 1.5rem;
      color: #3e2723;
    }
    .change-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .change-badge.up {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .change-badge.down {
      background: #ffebee;
      color: #c62828;
    }
    .change-badge.stable {
      background: #f5f5f5;
      color: #616161;
    }
    .change-badge mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .era-compare-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .era-compare-card mat-card-header {
      padding-bottom: 8px;
    }
    .compare-importance {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 0.9rem;
    }
    .compare-importance .label {
      color: #666;
    }
    .compare-importance .value {
      font-weight: 600;
      color: #3e2723;
    }
    .compare-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
      text-align: center;
    }
    .stat-val {
      display: block;
      font-size: 1.25rem;
      font-weight: bold;
      color: #5d4037;
    }
    .stat-lbl {
      font-size: 0.7rem;
      color: #999;
    }
    .compare-roles {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .role-changes h5 {
      margin: 0 0 8px 0;
      color: #5d4037;
    }
    .role-changes ul {
      margin: 0;
      padding-left: 20px;
      color: #666;
    }
    .role-changes li {
      margin-bottom: 4px;
    }
    .timeline-section h3 {
      margin: 0 0 16px 0;
      color: #5d4037;
    }
    .timeline-chart {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 24px;
    }
    .timeline-svg {
      width: 100%;
      height: 300px;
    }
    .axis-label {
      font-size: 11px;
      fill: #666;
    }
    .data-point {
      cursor: pointer;
    }
    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 12px;
    }
    .timeline-table h4 {
      margin: 0 0 12px 0;
      color: #5d4037;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .data-table th,
    .data-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #f0f0f0;
    }
    .data-table th {
      background: #fafafa;
      font-weight: 600;
      color: #5d4037;
      font-size: 0.9rem;
    }
    .data-table td {
      color: #666;
    }
    .data-table tr:hover td {
      background: #fafafa;
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
      margin: 0;
      color: #795548;
    }
    :host ::ng-deep .mat-mdc-tab-body-wrapper {
      min-height: 500px;
    }
    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
      .two-column {
        grid-template-columns: 1fr;
      }
      .comparison-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .city-selector mat-form-field {
        width: 100%;
      }
    }
  `]
})
export class EraAnalysisComponent implements OnInit {
  analysis: EraNetworkAnalysis | null = null;
  cityComparison: CityEraComparison | null = null;
  timelineData: TimelineDataPoint[] = [];

  startYear = 1870;
  endYear = 1945;
  yearRange = { min: 1850, max: 1950 };
  selectedPreset: string | null = null;

  presetEras: { name: string; startYear: number; endYear: number }[] = [];
  allCities: string[] = [];
  selectedCityForCompare = '';

  hoveredNode: string | null = null;
  tooltipPosition = { x: 0, y: 0 };

  private nodePositions = new Map<string, { x: number; y: number }>();
  displayEdges: NetworkEdge[] = [];

  routeLinePoints = '';
  cityLinePoints = '';
  gridLines: number[] = [];
  yAxisLabels: string[] = [];
  maxRouteCount = 0;
  maxCityCount = 0;

  constructor(
    private knowledgeService: PostalKnowledgeService,
    public labelService: LabelService,
    private statisticsService: StatisticsService
  ) {}

  ngOnInit(): void {
    this.yearRange = this.knowledgeService.getYearRange();
    this.presetEras = this.knowledgeService.getPresetEras();
    this.allCities = this.knowledgeService.getCities().map(c => c.name).sort();
    
    if (this.presetEras.length > 0) {
      this.startYear = this.yearRange.min;
      this.endYear = this.yearRange.max;
    }
    
    this.runAnalysis();
    this.generateTimeline();
  }

  selectPresetEra(era: { name: string; startYear: number; endYear: number }): void {
    this.selectedPreset = era.name;
    this.startYear = era.startYear;
    this.endYear = era.endYear;
    this.runAnalysis();
  }

  onYearRangeChange(): void {
    this.selectedPreset = 'custom';
    if (this.startYear > this.endYear) {
      const temp = this.startYear;
      this.startYear = this.endYear;
      this.endYear = temp;
    }
    this.runAnalysis();
  }

  runAnalysis(): void {
    this.analysis = this.knowledgeService.analyzeEraNetwork({
      startYear: this.startYear,
      endYear: this.endYear
    });
    
    this.displayEdges = this.analysis.edges;
    this.calculateNodePositions();
  }

  private calculateNodePositions(): void {
    if (!this.analysis) return;
    this.nodePositions = this.statisticsService.calculateNodePositions(
      this.analysis.nodes.map(n => ({
        name: n.name,
        connectionCount: n.connectionCount,
        importance: n.importance
      })),
      800,
      500,
      60
    );
  }

  getNodePosition(name: string): { x: number; y: number } | undefined {
    return this.nodePositions.get(name);
  }

  getNodeRadius(node: NetworkNode): number {
    return this.statisticsService.getNodeRadius(node);
  }

  getEdgeWidth(edge: NetworkEdge): number {
    return this.statisticsService.getEdgeWidth(edge);
  }

  get hoveredNodeData(): NetworkNode | undefined {
    if (!this.hoveredNode || !this.analysis) return undefined;
    return this.analysis.nodes.find(n => n.name === this.hoveredNode);
  }

  get hasRestrictedAreas(): boolean {
    return !!(this.analysis?.restrictedAreas && this.analysis.restrictedAreas.length > 0);
  }

  runComparison(): void {
    if (!this.selectedCityForCompare) {
      this.cityComparison = null;
      return;
    }

    const eras = this.presetEras.map(era => ({
      startYear: era.startYear,
      endYear: era.endYear,
      eraName: era.name
    }));

    this.cityComparison = this.knowledgeService.compareCityAcrossEras(
      this.selectedCityForCompare,
      eras
    );
  }

  private generateTimeline(): void {
    this.timelineData = this.knowledgeService.getTimelineData(
      this.yearRange.min,
      this.yearRange.max,
      10
    );

    this.maxRouteCount = Math.max(...this.timelineData.map(d => d.routeCount), 1);
    this.maxCityCount = Math.max(...this.timelineData.map(d => d.cityCount), 1);

    const chartTop = 30;
    const chartBottom = 260;
    const chartHeight = chartBottom - chartTop;

    this.gridLines = [
      chartTop,
      chartTop + chartHeight * 0.25,
      chartTop + chartHeight * 0.5,
      chartTop + chartHeight * 0.75,
      chartBottom
    ];

    this.yAxisLabels = [
      this.maxRouteCount.toString(),
      Math.round(this.maxRouteCount * 0.75).toString(),
      Math.round(this.maxRouteCount * 0.5).toString(),
      Math.round(this.maxRouteCount * 0.25).toString(),
      '0'
    ];

    this.routeLinePoints = this.timelineData.map((d, i) =>
      `${this.getXPosition(i)},${this.getYPosition(d.routeCount, this.maxRouteCount)}`
    ).join(' ');

    this.cityLinePoints = this.timelineData.map((d, i) =>
      `${this.getXPosition(i)},${this.getYPosition(d.cityCount, this.maxCityCount)}`
    ).join(' ');
  }

  getXPosition(index: number): number {
    const chartLeft = 60;
    const chartRight = 880;
    const chartWidth = chartRight - chartLeft;
    const step = this.timelineData.length > 1
      ? chartWidth / (this.timelineData.length - 1)
      : 0;
    return chartLeft + index * step;
  }

  getYPosition(value: number, maxValue: number): number {
    const chartTop = 30;
    const chartBottom = 260;
    const chartHeight = chartBottom - chartTop;
    return chartBottom - (value / maxValue) * chartHeight;
  }
}
