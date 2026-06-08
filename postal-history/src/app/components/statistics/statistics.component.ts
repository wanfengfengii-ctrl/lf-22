import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { LetterService } from '../../services/letter.service';
import { CityStat, DurationStat } from '../../models/letter.model';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, NgxChartsModule],
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

      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-content">
            <mat-icon class="stat-icon">flag</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ totalPostmarks }}</span>
              <span class="stat-label">邮戳总数</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

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
    :host ::ng-deep .ngx-charts-bar-horizontal .bar {
      border-radius: 4px;
    }
  `]
})
export class StatisticsComponent implements OnInit {
  cityStats: CityStat[] = [];
  durationStats: DurationStat[] = [];
  totalLetters = 0;
  totalCities = 0;
  totalPostmarks = 0;
  avgDuration: number | null = null;

  view: [number, number] = [700, 350];
  pieView: [number, number] = [800, 450];

  colorScheme = 'natural';
  customColors = [
    { name: '1', value: '#5D4037' },
    { name: '2', value: '#8D6E63' },
    { name: '3', value: '#006064' },
    { name: '4', value: '#00838F' },
    { name: '5', value: '#0097A7' },
    { name: '6', value: '#4DD0E1' },
    { name: '7', value: '#80DEEA' },
    { name: '8', value: '#B2EBF2' }
  ];

  constructor(private letterService: LetterService) {}

  ngOnInit(): void {
    this.loadStatistics();
    this.letterService.letters$.subscribe(() => {
      this.loadStatistics();
    });
  }

  private loadStatistics(): void {
    const letters = this.letterService.getLetters();
    this.totalLetters = letters.length;
    this.cityStats = this.letterService.getCityStats();
    this.totalCities = this.cityStats.length;
    this.durationStats = this.letterService.getDurationDistribution();
    this.avgDuration = this.letterService.getAverageDuration();

    this.totalPostmarks = letters.reduce((sum, l) => sum + l.postmarks.length, 0);
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
}
