import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { LetterService } from '../../services/letter.service';
import { ConfidenceService } from '../../services/confidence.service';
import { Letter, CityStat, DurationStat, RouteVersion } from '../../models/letter.model';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTabsModule,
    MatDividerModule,
    NgxChartsModule
  ],
  template: `
    <div class="page-header">
      <h1>统计分析</h1>
    </div>

    <div class="stats-overview">
      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-content">
            <mat-icon class="stat-icon">mail</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ totalLetters }}</span>
              <span class="stat-label">信件总数</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-content">
            <mat-icon class="stat-icon">route</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ totalVersions }}</span>
              <span class="stat-label">方案总数</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-content">
            <mat-icon class="stat-icon">place</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ totalCities }}</span>
              <span class="stat-label">涉及城市</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-content">
            <mat-icon class="stat-icon">schedule</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ avgDuration || '-' }}</span>
              <span class="stat-label">平均流转时长(天)</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <mat-tab-group>
      <mat-tab label="整体统计">
        <div class="charts-container">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>常见中转城市 Top 10</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper" *ngIf="cityChartData.length > 0">
                <ngx-charts-bar-horizontal
                  [view]="view"
                  [scheme]="colorScheme"
                  [results]="cityChartData"
                  [xAxis]="true"
                  [yAxis]="true"
                  [legend]="false"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  xAxisLabel="出现次数"
                  yAxisLabel="城市"
                  [barPadding]="8"
                  [animations]="true">
                </ngx-charts-bar-horizontal>
              </div>
              <div class="empty-chart" *ngIf="cityChartData.length === 0">
                <mat-icon>bar_chart</mat-icon>
                <p>暂无数据</p>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>流转时长分布</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper" *ngIf="durationChartData.length > 0">
                <ngx-charts-bar-vertical
                  [view]="view"
                  [scheme]="colorScheme"
                  [results]="durationChartData"
                  [xAxis]="true"
                  [yAxis]="true"
                  [legend]="false"
                  [showXAxisLabel]="true"
                  [showYAxisLabel]="true"
                  xAxisLabel="时长区间"
                  yAxisLabel="路段数量"
                  [barPadding]="20"
                  [animations]="true">
                </ngx-charts-bar-vertical>
              </div>
              <div class="empty-chart" *ngIf="durationChartData.length === 0">
                <mat-icon>bar_chart</mat-icon>
                <p>暂无数据</p>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card full-width">
            <mat-card-header>
              <mat-card-title>城市出现次数占比</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper pie-wrapper" *ngIf="cityChartData.length > 0">
                <ngx-charts-pie-chart
                  [view]="pieView"
                  [scheme]="colorScheme"
                  [results]="cityChartData.slice(0, 8)"
                  [legend]="true"
                  [explodeSlices]="false"
                  [doughnut]="false"
                  [animations]="true"
                  [labels]="true">
                </ngx-charts-pie-chart>
              </div>
              <div class="empty-chart" *ngIf="cityChartData.length === 0">
                <mat-icon>pie_chart</mat-icon>
                <p>暂无数据</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <mat-tab label="方案对比分析">
        <div class="compare-section">
          <mat-card class="selector-card">
            <mat-card-header>
              <mat-card-title>选择信件进行方案对比</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="selector-row">
                <mat-form-field appearance="outline" class="letter-selector">
                  <mat-label>选择信件</mat-label>
                  <mat-select [(value)]="selectedLetterId" (valueChange)="onLetterChange()">
                    <mat-option *ngFor="let letter of lettersWithMultipleVersions" [value]="letter.id">
                      {{ letter.title }} ({{ letter.versions?.length || 0 }} 个方案)
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <ng-container *ngIf="selectedLetter && selectedLetter.versions && selectedLetter.versions.length > 0">
            <div class="version-compare-grid">
              <mat-card
                class="version-compare-card"
                *ngFor="let version of selectedLetter.versions; let i = index"
                [class.official]="version.isOfficial"
              >
                <mat-card-header>
                  <mat-card-title>
                    <span class="version-title">
                      <mat-icon *ngIf="version.isOfficial" class="official-star" color="primary">star</mat-icon>
                      {{ version.name }}
                    </span>
                  </mat-card-title>
                  <mat-card-subtitle>{{ version.description || '无描述' }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="confidence-big" *ngIf="getConfidence(version)">
                    <div
                      class="confidence-score"
                      [style.color]="confidenceService.getConfidenceColor(getConfidence(version)?.percentage || 0)"
                    >
                      {{ getConfidence(version)?.percentage }}%
                    </div>
                    <div class="confidence-label">
                      {{ confidenceService.getConfidenceLabel(getConfidence(version)?.percentage || 0) }}
                    </div>
                  </div>

                  <mat-divider style="margin: 12px 0;"></mat-divider>

                  <div class="version-stats">
                    <div class="v-stat">
                      <span class="v-stat-label">站点数</span>
                      <span class="v-stat-value">{{ version.postmarks.length }}</span>
                    </div>
                    <div class="v-stat">
                      <span class="v-stat-label">总距离</span>
                      <span class="v-stat-value">{{ getVersionDistance(version) }} km</span>
                    </div>
                    <div class="v-stat">
                      <span class="v-stat-label">总时长</span>
                      <span class="v-stat-value">{{ getVersionDuration(version) }}</span>
                    </div>
                  </div>

                  <div class="transit-cities" *ngIf="getTransitCities(version).length > 0">
                    <h4>中转城市</h4>
                    <div class="city-tags">
                      <span class="city-tag" *ngFor="let city of getTransitCities(version)">
                        {{ city }}
                      </span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <mat-card class="diff-analysis-card" *ngIf="selectedLetter.versions.length >= 2">
              <mat-card-header>
                <mat-card-title>方案差异分析</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="diff-summary">
                  <div class="diff-item">
                    <span class="diff-label">平均流转时长</span>
                    <span class="diff-value">
                      {{ getAverageDurationDiff() }}
                    </span>
                  </div>
                  <div class="diff-item">
                    <span class="diff-label">平均站点数</span>
                    <span class="diff-value">
                      {{ getAverageStationCount() }} 个
                    </span>
                  </div>
                  <div class="diff-item">
                    <span class="diff-label">平均可信度</span>
                    <span class="diff-value">
                      {{ getAverageConfidence() }}%
                    </span>
                  </div>
                </div>

                <mat-divider style="margin: 16px 0;"></mat-divider>

                <div class="city-changes">
                  <h4>常见中转城市变化</h4>
                  <div class="city-change-list">
                    <div
                      class="city-change-item"
                      *ngFor="let change of getCityChanges()"
                    >
                      <span class="city-name">{{ change.name }}</span>
                      <span class="city-count">出现 {{ change.count }} 次</span>
                      <span class="city-versions">
                        {{ change.versions.join(', ') }}
                      </span>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </ng-container>

          <div class="empty-compare" *ngIf="lettersWithMultipleVersions.length === 0">
            <mat-icon>compare_arrows</mat-icon>
            <h3>暂无多方案信件</h3>
            <p>请先为信件创建多个方案，以便进行对比分析</p>
          </div>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .page-header {
      margin-bottom: 24px;
    }
    .page-header h1 {
      margin: 0;
      color: #5d4037;
    }
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: linear-gradient(135deg, #5d4037 0%, #8d6e63 100%);
      color: white;
    }
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.8;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      line-height: 1;
    }
    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-top: 4px;
    }
    .charts-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    .chart-card {
      min-height: 400px;
    }
    .chart-card.full-width {
      grid-column: 1 / -1;
    }
    .chart-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 350px;
    }
    .pie-wrapper {
      min-height: 450px;
    }
    .empty-chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: #999;
    }
    .empty-chart mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    .empty-chart p {
      margin: 0;
    }
    .compare-section {
      margin-top: 20px;
    }
    .selector-card {
      margin-bottom: 20px;
    }
    .selector-row {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }
    .letter-selector {
      flex: 1;
      max-width: 400px;
    }
    .version-compare-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .version-compare-card {
      transition: all 0.2s;
    }
    .version-compare-card.official {
      border: 2px solid #1976d2;
    }
    .version-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .official-star {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .confidence-big {
      text-align: center;
      padding: 16px 0;
    }
    .confidence-big .confidence-score {
      font-size: 3rem;
      font-weight: bold;
      display: block;
    }
    .confidence-big .confidence-label {
      font-size: 1rem;
      color: #666;
      margin-top: 4px;
    }
    .version-stats {
      display: flex;
      justify-content: space-around;
      text-align: center;
    }
    .v-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .v-stat-label {
      font-size: 0.8rem;
      color: #999;
    }
    .v-stat-value {
      font-size: 1.2rem;
      font-weight: 600;
      color: #5d4037;
    }
    .transit-cities {
      margin-top: 16px;
    }
    .transit-cities h4 {
      margin: 0 0 8px 0;
      font-size: 0.9rem;
      color: #666;
    }
    .city-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .city-tag {
      background: #efebe9;
      color: #5d4037;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    .diff-analysis-card {
      margin-top: 20px;
    }
    .diff-summary {
      display: flex;
      justify-content: space-around;
      text-align: center;
    }
    .diff-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .diff-item .diff-label {
      font-size: 0.85rem;
      color: #999;
    }
    .diff-item .diff-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #5d4037;
    }
    .city-changes {
      margin-top: 8px;
    }
    .city-changes h4 {
      margin: 0 0 12px 0;
      color: #5d4037;
    }
    .city-change-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .city-change-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: #fafafa;
      border-radius: 6px;
    }
    .city-change-item .city-name {
      font-weight: 500;
      min-width: 100px;
    }
    .city-change-item .city-count {
      color: #666;
      font-size: 0.9rem;
    }
    .city-change-item .city-versions {
      margin-left: auto;
      font-size: 0.8rem;
      color: #999;
    }
    .empty-compare {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }
    .empty-compare mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    .empty-compare h3 {
      margin: 0 0 8px 0;
    }
    .empty-compare p {
      margin: 0;
    }
    :host ::ng-deep .ngx-charts-bar-horizontal .bar {
      border-radius: 4px;
    }
    :host ::ng-deep .mat-mdc-tab-body-wrapper {
      min-height: 500px;
    }
  `]
})
export class StatisticsComponent implements OnInit {
  cityStats: CityStat[] = [];
  durationStats: DurationStat[] = [];
  totalLetters = 0;
  totalCities = 0;
  totalVersions = 0;
  totalPostmarks = 0;
  avgDuration: number | null = null;

  letters: Letter[] = [];
  selectedLetterId: string = '';
  selectedLetter: Letter | null = null;

  view: [number, number] = [700, 350];
  pieView: [number, number] = [800, 450];

  colorScheme = 'natural';

  constructor(
    private letterService: LetterService,
    public confidenceService: ConfidenceService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
    this.letterService.letters$.subscribe(() => {
      this.loadStatistics();
    });
  }

  private loadStatistics(): void {
    const letters = this.letterService.getLetters();
    this.letters = letters;
    this.totalLetters = letters.length;
    this.cityStats = this.letterService.getCityStats();
    this.totalCities = this.cityStats.length;
    this.durationStats = this.letterService.getDurationDistribution();
    this.avgDuration = this.letterService.getAverageDuration();

    this.totalVersions = letters.reduce((sum, l) => sum + (l.versions?.length || 0), 0);
    this.totalPostmarks = letters.reduce((sum, l) => sum + l.postmarks.length, 0);

    const lettersWithMultiple = this.lettersWithMultipleVersions;
    if (lettersWithMultiple.length > 0 && !this.selectedLetterId) {
      this.selectedLetterId = lettersWithMultiple[0].id;
      this.selectedLetter = lettersWithMultiple[0];
    }
  }

  get lettersWithMultipleVersions(): Letter[] {
    return this.letters.filter(l => l.versions && l.versions.length > 1);
  }

  onLetterChange(): void {
    this.selectedLetter = this.letters.find(l => l.id === this.selectedLetterId) || null;
  }

  get cityChartData(): { name: string; value: number }[] {
    return this.cityStats.slice(0, 10).map(s => ({
      name: s.name,
      value: s.count
    }));
  }

  get durationChartData(): { name: string; value: number }[] {
    return this.durationStats.map(s => ({
      name: s.label,
      value: s.value
    })).filter(s => s.value > 0);
  }

  getConfidence(version: RouteVersion): any {
    if (!version.postmarks || version.postmarks.length === 0) return null;
    return this.confidenceService.calculateConfidence(version.postmarks);
  }

  getVersionDistance(version: RouteVersion): string {
    const dist = this.letterService.getVersionTotalDistance(version);
    return dist > 0 ? dist.toLocaleString() : '-';
  }

  getVersionDuration(version: RouteVersion): string {
    const duration = this.letterService.getVersionDuration(version);
    return duration !== null ? `${duration} 天` : '-';
  }

  getTransitCities(version: RouteVersion): string[] {
    return this.letterService.getVersionTransitCities(version);
  }

  getAverageDurationDiff(): string {
    if (!this.selectedLetter?.versions) return '-';
    const durations = this.selectedLetter.versions
      .map(v => this.letterService.getVersionDuration(v))
      .filter((d): d is number => d !== null);

    if (durations.length === 0) return '-';
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return `约 ${Math.round(avg)} 天`;
  }

  getAverageStationCount(): string {
    if (!this.selectedLetter?.versions) return '-';
    const counts = this.selectedLetter.versions.map(v => v.postmarks.length);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    return avg.toFixed(1);
  }

  getAverageConfidence(): string {
    if (!this.selectedLetter?.versions) return '-';
    const confidences = this.selectedLetter.versions
      .map(v => this.confidenceService.calculateConfidence(v.postmarks).percentage);
    const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    return Math.round(avg).toString();
  }

  getCityChanges(): { name: string; count: number; versions: string[] }[] {
    if (!this.selectedLetter?.versions) return [];

    const cityMap = new Map<string, { count: number; versions: string[] }>();

    for (const version of this.selectedLetter.versions) {
      const cities = this.letterService.getVersionTransitCities(version);
      for (const city of cities) {
        const existing = cityMap.get(city);
        if (existing) {
          existing.count++;
          existing.versions.push(version.name);
        } else {
          cityMap.set(city, { count: 1, versions: [version.name] });
        }
      }
    }

    return Array.from(cityMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }
}
