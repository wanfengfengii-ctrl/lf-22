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
    MatCardModule
  ],
  template: `
    <div class="knowledge-base">
      <div class="header">
        <h2>历史邮路知识库</h2>
        <p class="subtitle">管理邮政线路规则、中转城市、禁限寄区域和运输时长数据</p>
      </div>

      <mat-tab-group>
        <mat-tab label="邮路规则">
          <div class="tab-content">
            <div class="tab-header">
              <h3>邮路规则</h3>
              <button mat-raised-button color="primary" (click)="openRuleDialog()">
                <mat-icon>add</mat-icon>
                新增规则
              </button>
            </div>

            <mat-table [dataSource]="rules" class="data-table">
              <ng-container matColumnDef="name">
                <mat-header-cell *matHeaderCellDef>规则名称</mat-header-cell>
                <mat-cell *matCellDef="let rule">{{ rule.name }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="era">
                <mat-header-cell *matHeaderCellDef>年代</mat-header-cell>
                <mat-cell *matCellDef="let rule">{{ rule.era }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="route">
                <mat-header-cell *matHeaderCellDef>路线</mat-header-cell>
                <mat-cell *matCellDef="let rule">
                  {{ rule.origin }} → {{ rule.destination }}
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="transit">
                <mat-header-cell *matHeaderCellDef>中转城市</mat-header-cell>
                <mat-cell *matCellDef="let rule">
                  {{ rule.transitCities.length > 0 ? rule.transitCities.join('、') : '直运' }}
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="duration">
                <mat-header-cell *matHeaderCellDef>典型时长</mat-header-cell>
                <mat-cell *matCellDef="let rule">
                  {{ rule.typicalDurationDays ? rule.typicalDurationDays + ' 天' : '未设置' }}
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="transport">
                <mat-header-cell *matHeaderCellDef>运输方式</mat-header-cell>
                <mat-cell *matCellDef="let rule">
                  {{ getTransportLabel(rule.transportType) }}
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="actions">
                <mat-header-cell *matHeaderCellDef>操作</mat-header-cell>
                <mat-cell *matCellDef="let rule">
                  <button mat-icon-button (click)="openRuleDialog(rule)" title="编辑">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteRule(rule)" title="删除">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-cell>
              </ng-container>

              <mat-header-row *matHeaderRowDef="ruleColumns"></mat-header-row>
              <mat-row *matRowDef="let row; columns: ruleColumns"></mat-row>
            </mat-table>
          </div>
        </mat-tab>

        <mat-tab label="中转城市">
          <div class="tab-content">
            <div class="tab-header">
              <h3>中转城市</h3>
              <button mat-raised-button color="primary" (click)="openCityDialog()">
                <mat-icon>add</mat-icon>
                新增城市
              </button>
            </div>

            <mat-table [dataSource]="cities" class="data-table">
              <ng-container matColumnDef="name">
                <mat-header-cell *matHeaderCellDef>城市名称</mat-header-cell>
                <mat-cell *matCellDef="let city">{{ city.name }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="era">
                <mat-header-cell *matHeaderCellDef>年代</mat-header-cell>
                <mat-cell *matCellDef="let city">{{ city.era }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="importance">
                <mat-header-cell *matHeaderCellDef>重要性</mat-header-cell>
                <mat-cell *matCellDef="let city">
                  {{ getImportanceLabel(city.importance) }}
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="roles">
                <mat-header-cell *matHeaderCellDef>功能</mat-header-cell>
                <mat-cell *matCellDef="let city">
                  {{ city.roles.map(r => getRoleLabel(r)).join('、') }}
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="province">
                <mat-header-cell *matHeaderCellDef>省份</mat-header-cell>
                <mat-cell *matCellDef="let city">{{ city.province || '-' }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="actions">
                <mat-header-cell *matHeaderCellDef>操作</mat-header-cell>
                <mat-cell *matCellDef="let city">
                  <button mat-icon-button (click)="openCityDialog(city)" title="编辑">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteCity(city)" title="删除">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-cell>
              </ng-container>

              <mat-header-row *matHeaderRowDef="cityColumns"></mat-header-row>
              <mat-row *matRowDef="let row; columns: cityColumns"></mat-row>
            </mat-table>
          </div>
        </mat-tab>

        <mat-tab label="禁限寄区域">
          <div class="tab-content">
            <div class="tab-header">
              <h3>禁限寄区域</h3>
              <button mat-raised-button color="primary" (click)="openRestrictedDialog()">
                <mat-icon>add</mat-icon>
                新增区域
              </button>
            </div>

            <mat-table [dataSource]="restrictedAreas" class="data-table">
              <ng-container matColumnDef="name">
                <mat-header-cell *matHeaderCellDef>区域名称</mat-header-cell>
                <mat-cell *matCellDef="let area">{{ area.name }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="era">
                <mat-header-cell *matHeaderCellDef>年代</mat-header-cell>
                <mat-cell *matCellDef="let area">{{ area.era }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="type">
                <mat-header-cell *matHeaderCellDef>限制类型</mat-header-cell>
                <mat-cell *matCellDef="let area">
                  {{ getRestrictionTypeLabel(area.restrictionType) }}
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="areaType">
                <mat-header-cell *matHeaderCellDef>区域类型</mat-header-cell>
                <mat-cell *matCellDef="let area">
                  {{ getAreaTypeLabel(area.areaType) }}
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="locations">
                <mat-header-cell *matHeaderCellDef>涉及地点</mat-header-cell>
                <mat-cell *matCellDef="let area">
                  {{ area.locationNames.join('、') }}
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="period">
                <mat-header-cell *matHeaderCellDef>时间范围</mat-header-cell>
                <mat-cell *matCellDef="let area">
                  {{ area.startYear || '?' }} - {{ area.endYear || '?' }}
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="actions">
                <mat-header-cell *matHeaderCellDef>操作</mat-header-cell>
                <mat-cell *matCellDef="let area">
                  <button mat-icon-button (click)="openRestrictedDialog(area)" title="编辑">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteRestrictedArea(area)" title="删除">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-cell>
              </ng-container>

              <mat-header-row *matHeaderRowDef="restrictedColumns"></mat-header-row>
              <mat-row *matRowDef="let row; columns: restrictedColumns"></mat-row>
            </mat-table>
          </div>
        </mat-tab>

        <mat-tab label="运输时长">
          <div class="tab-content">
            <div class="tab-header">
              <h3>运输时长</h3>
              <button mat-raised-button color="primary" (click)="openDurationDialog()">
                <mat-icon>add</mat-icon>
                新增时长
              </button>
            </div>

            <mat-table [dataSource]="durations" class="data-table">
              <ng-container matColumnDef="route">
                <mat-header-cell *matHeaderCellDef>路线</mat-header-cell>
                <mat-cell *matCellDef="let d">{{ d.fromCity }} → {{ d.toCity }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="era">
                <mat-header-cell *matHeaderCellDef>年代</mat-header-cell>
                <mat-cell *matCellDef="let d">{{ d.era }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="transport">
                <mat-header-cell *matHeaderCellDef>运输方式</mat-header-cell>
                <mat-cell *matCellDef="let d">
                  {{ getTransportLabel(d.transportType) }}
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="typical">
                <mat-header-cell *matHeaderCellDef>典型天数</mat-header-cell>
                <mat-cell *matCellDef="let d">{{ d.typicalDays }} 天</mat-cell>
              </ng-container>

              <ng-container matColumnDef="range">
                <mat-header-cell *matHeaderCellDef>时间范围</mat-header-cell>
                <mat-cell *matCellDef="let d">
                  {{ d.minDays || '?' }} - {{ d.maxDays || '?' }} 天
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="actions">
                <mat-header-cell *matHeaderCellDef>操作</mat-header-cell>
                <mat-cell *matCellDef="let d">
                  <button mat-icon-button (click)="openDurationDialog(d)" title="编辑">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteDuration(d)" title="删除">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-cell>
              </ng-container>

              <mat-header-row *matHeaderRowDef="durationColumns"></mat-header-row>
              <mat-row *matRowDef="let row; columns: durationColumns"></mat-row>
            </mat-table>
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
    .tab-content {
      padding: 16px 0;
    }
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .tab-header h3 {
      margin: 0;
      color: #4e342e;
    }
    .data-table {
      width: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    :host ::ng-deep .mat-mdc-tab-body-wrapper {
      min-height: 500px;
    }
  `]
})
export class KnowledgeBaseComponent implements OnInit {
  rules: PostalRouteRule[] = [];
  cities: TransitCity[] = [];
  restrictedAreas: RestrictedArea[] = [];
  durations: TransitDuration[] = [];

  ruleColumns = ['name', 'era', 'route', 'transit', 'duration', 'transport', 'actions'];
  cityColumns = ['name', 'era', 'importance', 'roles', 'province', 'actions'];
  restrictedColumns = ['name', 'era', 'type', 'areaType', 'locations', 'period', 'actions'];
  durationColumns = ['route', 'era', 'transport', 'typical', 'range', 'actions'];

  constructor(
    private knowledgeService: PostalKnowledgeService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.rules = this.knowledgeService.getRules();
    this.cities = this.knowledgeService.getCities();
    this.restrictedAreas = this.knowledgeService.getRestrictedAreas();
    this.durations = this.knowledgeService.getDurations();
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
      primary: '主要',
      secondary: '次要',
      tertiary: '三级'
    };
    return labels[importance] || importance;
  }

  getRoleLabel(role: TransitRole): string {
    const labels: Record<TransitRole, string> = {
      hub: '枢纽',
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
    // 简易编辑：使用 prompt 方式快速实现，后续可改为完整表单
    if (rule) {
      const newName = prompt('编辑规则名称:', rule.name);
      if (newName !== null) {
        this.knowledgeService.updateRule(rule.id, { name: newName });
        this.loadData();
      }
    } else {
      const name = prompt('输入规则名称:');
      if (name) {
        const origin = prompt('输入起点城市:') || '';
        const destination = prompt('输入终点城市:') || '';
        const era = prompt('输入年代（如：清代、民国）:', '清代') || '清代';
        this.knowledgeService.addRule({
          name,
          era,
          startYear: null,
          endYear: null,
          origin,
          destination,
          transitCities: [],
          typicalDurationDays: null,
          minDurationDays: null,
          maxDurationDays: null,
          transportType: 'mixed'
        });
        this.loadData();
      }
    }
  }

  deleteRule(rule: PostalRouteRule): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '确认删除',
        message: `确定要删除规则「${rule.name}」吗？此操作不可恢复。`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.knowledgeService.deleteRule(rule.id);
        this.loadData();
      }
    });
  }

  openCityDialog(city?: TransitCity): void {
    if (city) {
      const newName = prompt('编辑城市名称:', city.name);
      if (newName !== null) {
        this.knowledgeService.updateCity(city.id, { name: newName });
        this.loadData();
      }
    } else {
      const name = prompt('输入城市名称:');
      if (name) {
        const era = prompt('输入年代:', '清代民国') || '清代民国';
        this.knowledgeService.addCity({
          name,
          latitude: null,
          longitude: null,
          era,
          importance: 'secondary',
          roles: ['hub']
        });
        this.loadData();
      }
    }
  }

  deleteCity(city: TransitCity): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '确认删除',
        message: `确定要删除城市「${city.name}」吗？此操作不可恢复。`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.knowledgeService.deleteCity(city.id);
        this.loadData();
      }
    });
  }

  openRestrictedDialog(area?: RestrictedArea): void {
    if (area) {
      const newName = prompt('编辑区域名称:', area.name);
      if (newName !== null) {
        this.knowledgeService.updateRestrictedArea(area.id, { name: newName });
        this.loadData();
      }
    } else {
      const name = prompt('输入区域名称:');
      if (name) {
        const era = prompt('输入年代:', '清代') || '清代';
        this.knowledgeService.addRestrictedArea({
          name,
          era,
          startYear: null,
          endYear: null,
          restrictionType: 'restricted',
          areaType: 'region',
          locationNames: []
        });
        this.loadData();
      }
    }
  }

  deleteRestrictedArea(area: RestrictedArea): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '确认删除',
        message: `确定要删除区域「${area.name}」吗？此操作不可恢复。`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.knowledgeService.deleteRestrictedArea(area.id);
        this.loadData();
      }
    });
  }

  openDurationDialog(duration?: TransitDuration): void {
    if (duration) {
      const days = prompt('编辑典型天数:', String(duration.typicalDays));
      if (days !== null) {
        const numDays = parseFloat(days);
        if (!isNaN(numDays)) {
          this.knowledgeService.updateDuration(duration.id, { typicalDays: numDays });
          this.loadData();
        }
      }
    } else {
      const fromCity = prompt('输入起点城市:');
      const toCity = prompt('输入终点城市:');
      if (fromCity && toCity) {
        const era = prompt('输入年代:', '清代') || '清代';
        const daysStr = prompt('输入典型天数:', '5');
        const days = daysStr ? parseFloat(daysStr) : 5;
        this.knowledgeService.addDuration({
          fromCity,
          toCity,
          era,
          transportType: 'mixed',
          typicalDays: isNaN(days) ? 5 : days,
          minDays: null,
          maxDays: null
        });
        this.loadData();
      }
    }
  }

  deleteDuration(duration: TransitDuration): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '确认删除',
        message: `确定要删除「${duration.fromCity} → ${duration.toCity}」的时长记录吗？`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.knowledgeService.deleteDuration(duration.id);
        this.loadData();
      }
    });
  }
}
