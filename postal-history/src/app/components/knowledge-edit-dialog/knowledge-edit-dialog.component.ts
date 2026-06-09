import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
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

export type KnowledgeEntityType = 'rule' | 'city' | 'restricted' | 'duration';

export interface KnowledgeEditDialogData {
  type: KnowledgeEntityType;
  entity?: any;
  cities?: TransitCity[];
}

@Component({
  selector: 'app-knowledge-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatChipsModule,
    MatTabsModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>{{ dialogTitle }}</h2>

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="dialog-content">
        <!-- 邮路规则表单 -->
        <div *ngIf="data.type === 'rule'" class="form-container">
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>规则名称 *</mat-label>
              <input matInput formControlName="name" placeholder="如：清代上海-北京津海关线">
              <mat-error *ngIf="form.get('name')?.hasError('required')">名称不能为空</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>年代 *</mat-label>
              <input matInput formControlName="era" placeholder="如：清代、民国">
              <mat-error *ngIf="form.get('era')?.hasError('required')">年代不能为空</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>运输方式</mat-label>
              <mat-select formControlName="transportType">
                <mat-option value="land">陆路</mat-option>
                <mat-option value="water">水路</mat-option>
                <mat-option value="rail">铁路</mat-option>
                <mat-option value="air">航空</mat-option>
                <mat-option value="mixed">联运</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>起点城市 *</mat-label>
              <input matInput formControlName="origin" placeholder="如：上海">
              <mat-error *ngIf="form.get('origin')?.hasError('required')">起点不能为空</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>终点城市 *</mat-label>
              <input matInput formControlName="destination" placeholder="如：北京">
              <mat-error *ngIf="form.get('destination')?.hasError('required')">终点不能为空</mat-error>
            </mat-form-field>
          </div>

          <div class="section-title">中转城市</div>
          <div class="chips-input">
            <mat-chip-grid #chipGrid aria-label="中转城市列表">
              <mat-chip-row
                *ngFor="let city of transitCitiesArray.controls; let i = index"
                (removed)="removeTransitCity(i)"
              >
                {{ city.value }}
                <button matChipRemove [attr.aria-label]="'移除 ' + city.value">
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip-row>
            </mat-chip-grid>
            <div class="chip-input-wrapper">
              <input
                placeholder="输入中转城市后按回车添加"
                [matChipInputFor]="chipGrid"
                [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                (matChipInputTokenEnd)="addTransitCity($event)"
              />
            </div>
          </div>
          <p class="hint-text">按回车或逗号添加，点击 x 移除</p>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>典型时长（天）</mat-label>
              <input matInput type="number" formControlName="typicalDurationDays" min="0" step="0.5">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>最短时长（天）</mat-label>
              <input matInput type="number" formControlName="minDurationDays" min="0" step="0.5">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>最长时长（天）</mat-label>
              <input matInput type="number" formControlName="maxDurationDays" min="0" step="0.5">
            </mat-form-field>
          </div>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>起始年份</mat-label>
              <input matInput type="number" formControlName="startYear" placeholder="如：1878">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>结束年份</mat-label>
              <input matInput type="number" formControlName="endYear" placeholder="如：1911">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>发运频率</mat-label>
              <input matInput formControlName="frequency" placeholder="如：每周三班">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>描述</mat-label>
            <textarea matInput formControlName="description" rows="2" placeholder="路线描述、历史背景等"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>资料来源</mat-label>
            <input matInput formControlName="source" placeholder="如：中国近代邮政史、海关档案等">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>备注</mat-label>
            <textarea matInput formControlName="notes" rows="2" placeholder="其他补充说明"></textarea>
          </mat-form-field>
        </div>

        <!-- 中转城市表单 -->
        <div *ngIf="data.type === 'city'" class="form-container">
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>城市名称 *</mat-label>
              <input matInput formControlName="name" placeholder="如：上海">
              <mat-error *ngIf="form.get('name')?.hasError('required')">名称不能为空</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>省份</mat-label>
              <input matInput formControlName="province" placeholder="如：江苏">
            </mat-form-field>
          </div>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>年代 *</mat-label>
              <input matInput formControlName="era" placeholder="如：清代民国">
              <mat-error *ngIf="form.get('era')?.hasError('required')">年代不能为空</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>重要性</mat-label>
              <mat-select formControlName="importance">
                <mat-option value="primary">主要枢纽</mat-option>
                <mat-option value="secondary">次要城市</mat-option>
                <mat-option value="tertiary">三级站点</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="section-title">经纬度</div>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>纬度</mat-label>
              <input matInput type="number" formControlName="latitude" step="0.0001" placeholder="如：31.2304">
              <mat-hint>范围: -90 到 90</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>经度</mat-label>
              <input matInput type="number" formControlName="longitude" step="0.0001" placeholder="如：121.4737">
              <mat-hint>范围: -180 到 180</mat-hint>
            </mat-form-field>
          </div>

          <div class="section-title">功能角色</div>
          <div class="checkbox-group">
            <mat-checkbox formControlName="role_hub">邮政枢纽</mat-checkbox>
            <mat-checkbox formControlName="role_port">港口</mat-checkbox>
            <mat-checkbox formControlName="role_customs">海关</mat-checkbox>
            <mat-checkbox formControlName="role_railway_station">火车站</mat-checkbox>
            <mat-checkbox formControlName="role_border">边境</mat-checkbox>
            <mat-checkbox formControlName="role_relay">驿站</mat-checkbox>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>城市描述</mat-label>
            <textarea matInput formControlName="description" rows="2" placeholder="城市的邮政历史地位等"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>资料来源</mat-label>
            <input matInput formControlName="source" placeholder="如：中国邮政史、地方史志等">
          </mat-form-field>
        </div>

        <!-- 禁限寄区域表单 -->
        <div *ngIf="data.type === 'restricted'" class="form-container">
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>区域名称 *</mat-label>
              <input matInput formControlName="name" placeholder="如：东北战区（日俄战争）">
              <mat-error *ngIf="form.get('name')?.hasError('required')">名称不能为空</mat-error>
            </mat-form-field>
          </div>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>年代 *</mat-label>
              <input matInput formControlName="era" placeholder="如：清代">
              <mat-error *ngIf="form.get('era')?.hasError('required')">年代不能为空</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>限制类型</mat-label>
              <mat-select formControlName="restrictionType">
                <mat-option value="prohibited">禁止通行</mat-option>
                <mat-option value="restricted">限制通行</mat-option>
                <mat-option value="suspended">暂停服务</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>区域类型</mat-label>
              <mat-select formControlName="areaType">
                <mat-option value="city">城市</mat-option>
                <mat-option value="region">地区</mat-option>
                <mat-option value="border">边境</mat-option>
                <mat-option value="route">路线</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>起始年份</mat-label>
              <input matInput type="number" formControlName="startYear" placeholder="如：1904">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>结束年份</mat-label>
              <input matInput type="number" formControlName="endYear" placeholder="如：1905">
            </mat-form-field>
          </div>

          <div class="section-title">涉及地点</div>
          <div class="chips-input">
            <mat-chip-grid #chipGrid2 aria-label="涉及地点列表">
              <mat-chip-row
                *ngFor="let loc of locationNamesArray.controls; let i = index"
                (removed)="removeLocationName(i)"
              >
                {{ loc.value }}
                <button matChipRemove [attr.aria-label]="'移除 ' + loc.value">
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip-row>
            </mat-chip-grid>
            <div class="chip-input-wrapper">
              <input
                placeholder="输入地点后按回车添加"
                [matChipInputFor]="chipGrid2"
                [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                (matChipInputTokenEnd)="addLocationName($event)"
              />
            </div>
          </div>
          <p class="hint-text">按回车或逗号添加，点击 x 移除</p>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>描述</mat-label>
            <textarea matInput formControlName="description" rows="2" placeholder="禁限寄的原因、历史背景等"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>资料来源</mat-label>
            <input matInput formControlName="source" placeholder="如：清代邮政档案、历史文献等">
          </mat-form-field>
        </div>

        <!-- 运输时长表单 -->
        <div *ngIf="data.type === 'duration'" class="form-container">
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>起点城市 *</mat-label>
              <input matInput formControlName="fromCity" placeholder="如：上海">
              <mat-error *ngIf="form.get('fromCity')?.hasError('required')">起点不能为空</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>终点城市 *</mat-label>
              <input matInput formControlName="toCity" placeholder="如：天津">
              <mat-error *ngIf="form.get('toCity')?.hasError('required')">终点不能为空</mat-error>
            </mat-form-field>
          </div>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>年代 *</mat-label>
              <input matInput formControlName="era" placeholder="如：清代">
              <mat-error *ngIf="form.get('era')?.hasError('required')">年代不能为空</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>运输方式</mat-label>
              <mat-select formControlName="transportType">
                <mat-option value="land">陆路</mat-option>
                <mat-option value="water">水路</mat-option>
                <mat-option value="rail">铁路</mat-option>
                <mat-option value="air">航空</mat-option>
                <mat-option value="mixed">联运</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>典型天数 *</mat-label>
              <input matInput type="number" formControlName="typicalDays" min="0" step="0.5" placeholder="如：4">
              <mat-error *ngIf="form.get('typicalDays')?.hasError('required')">典型天数不能为空</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>最短天数</mat-label>
              <input matInput type="number" formControlName="minDays" min="0" step="0.5" placeholder="如：3">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>最长天数</mat-label>
              <input matInput type="number" formControlName="maxDays" min="0" step="0.5" placeholder="如：6">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>资料来源</mat-label>
            <input matInput formControlName="source" placeholder="如：海关邮政档案、航运史料等">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>备注</mat-label>
            <textarea matInput formControlName="notes" rows="2" placeholder="运输方式细节、影响因素等"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">取消</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!form.valid">
          {{ isEdit ? '保存修改' : '添加' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-content {
      min-width: 500px;
      max-height: 70vh;
      overflow-y: auto;
    }
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .section-title {
      font-weight: 600;
      color: #5d4037;
      margin-top: 8px;
      font-size: 0.95rem;
    }
    .chips-input {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      min-height: 48px;
    }
    .chip-input-wrapper {
      flex: 1;
      min-width: 150px;
    }
    .chip-input-wrapper input {
      width: 100%;
      border: none;
      outline: none;
      font-size: 1rem;
    }
    .hint-text {
      margin: 4px 0 0 0;
      font-size: 0.8rem;
      color: #999;
    }
    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding: 8px 0;
    }
    mat-form-field {
      width: 100%;
    }
  `]
})
export class KnowledgeEditDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;

  separatorKeysCodes = [13, 188];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<KnowledgeEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: KnowledgeEditDialogData
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.data.entity;
    this.buildForm();

    if (this.data.entity) {
      this.populateForm(this.data.entity);
    }
  }

  get dialogTitle(): string {
    const titles: Record<KnowledgeEntityType, { add: string; edit: string }> = {
      rule: { add: '新增邮路规则', edit: '编辑邮路规则' },
      city: { add: '新增中转城市', edit: '编辑中转城市' },
      restricted: { add: '新增禁限寄区域', edit: '编辑禁限寄区域' },
      duration: { add: '新增运输时长', edit: '编辑运输时长' }
    };
    return titles[this.data.type][this.isEdit ? 'edit' : 'add'];
  }

  get transitCitiesArray(): FormArray {
    return this.form.get('transitCities') as FormArray;
  }

  get locationNamesArray(): FormArray {
    return this.form.get('locationNames') as FormArray;
  }

  private buildForm(): void {
    switch (this.data.type) {
      case 'rule':
        this.form = this.fb.group({
          name: ['', Validators.required],
          era: ['', Validators.required],
          startYear: [null as number | null],
          endYear: [null as number | null],
          description: [''],
          origin: ['', Validators.required],
          destination: ['', Validators.required],
          transitCities: this.fb.array([]),
          typicalDurationDays: [null as number | null],
          minDurationDays: [null as number | null],
          maxDurationDays: [null as number | null],
          transportType: ['mixed' as TransportType],
          frequency: [''],
          source: [''],
          notes: ['']
        });
        break;

      case 'city':
        this.form = this.fb.group({
          name: ['', Validators.required],
          latitude: [null as number | null],
          longitude: [null as number | null],
          province: [''],
          era: ['', Validators.required],
          importance: ['secondary' as 'primary' | 'secondary' | 'tertiary'],
          role_hub: [false],
          role_port: [false],
          role_customs: [false],
          role_railway_station: [false],
          role_border: [false],
          role_relay: [false],
          description: [''],
          source: ['']
        });
        break;

      case 'restricted':
        this.form = this.fb.group({
          name: ['', Validators.required],
          era: ['', Validators.required],
          startYear: [null as number | null],
          endYear: [null as number | null],
          restrictionType: ['restricted' as RestrictionType],
          areaType: ['region' as AreaType],
          locationNames: this.fb.array([]),
          description: [''],
          source: ['']
        });
        break;

      case 'duration':
        this.form = this.fb.group({
          fromCity: ['', Validators.required],
          toCity: ['', Validators.required],
          era: ['', Validators.required],
          transportType: ['mixed' as TransportType],
          typicalDays: [0, Validators.required],
          minDays: [null as number | null],
          maxDays: [null as number | null],
          source: [''],
          notes: ['']
        });
        break;
    }
  }

  private populateForm(entity: any): void {
    switch (this.data.type) {
      case 'rule':
        const rule = entity as PostalRouteRule;
        this.form.patchValue({
          name: rule.name,
          era: rule.era,
          startYear: rule.startYear,
          endYear: rule.endYear,
          description: rule.description || '',
          origin: rule.origin,
          destination: rule.destination,
          typicalDurationDays: rule.typicalDurationDays,
          minDurationDays: rule.minDurationDays,
          maxDurationDays: rule.maxDurationDays,
          transportType: rule.transportType,
          frequency: rule.frequency || '',
          source: rule.source || '',
          notes: rule.notes || ''
        });
        rule.transitCities.forEach(city => {
          this.transitCitiesArray.push(this.fb.control(city));
        });
        break;

      case 'city':
        const city = entity as TransitCity;
        this.form.patchValue({
          name: city.name,
          latitude: city.latitude,
          longitude: city.longitude,
          province: city.province || '',
          era: city.era,
          importance: city.importance,
          description: city.description || '',
          source: city.source || '',
          role_hub: city.roles.includes('hub'),
          role_port: city.roles.includes('port'),
          role_customs: city.roles.includes('customs'),
          role_railway_station: city.roles.includes('railway_station'),
          role_border: city.roles.includes('border'),
          role_relay: city.roles.includes('relay')
        });
        break;

      case 'restricted':
        const restricted = entity as RestrictedArea;
        this.form.patchValue({
          name: restricted.name,
          era: restricted.era,
          startYear: restricted.startYear,
          endYear: restricted.endYear,
          restrictionType: restricted.restrictionType,
          areaType: restricted.areaType,
          description: restricted.description || '',
          source: restricted.source || ''
        });
        restricted.locationNames.forEach(loc => {
          this.locationNamesArray.push(this.fb.control(loc));
        });
        break;

      case 'duration':
        const duration = entity as TransitDuration;
        this.form.patchValue({
          fromCity: duration.fromCity,
          toCity: duration.toCity,
          era: duration.era,
          transportType: duration.transportType,
          typicalDays: duration.typicalDays,
          minDays: duration.minDays,
          maxDays: duration.maxDays,
          source: duration.source || '',
          notes: duration.notes || ''
        });
        break;
    }
  }

  addTransitCity(event: any): void {
    const value = (event.value || '').trim();
    if (value) {
      this.transitCitiesArray.push(this.fb.control(value));
      event.chipInput!.clear();
    }
  }

  removeTransitCity(index: number): void {
    this.transitCitiesArray.removeAt(index);
  }

  addLocationName(event: any): void {
    const value = (event.value || '').trim();
    if (value) {
      this.locationNamesArray.push(this.fb.control(value));
      event.chipInput!.clear();
    }
  }

  removeLocationName(index: number): void {
    this.locationNamesArray.removeAt(index);
  }

  private getRolesFromForm(): TransitRole[] {
    const roles: TransitRole[] = [];
    if (this.form.get('role_hub')?.value) roles.push('hub');
    if (this.form.get('role_port')?.value) roles.push('port');
    if (this.form.get('role_customs')?.value) roles.push('customs');
    if (this.form.get('role_railway_station')?.value) roles.push('railway_station');
    if (this.form.get('role_border')?.value) roles.push('border');
    if (this.form.get('role_relay')?.value) roles.push('relay');
    return roles;
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    let result: any;
    const formValue = this.form.value;

    switch (this.data.type) {
      case 'rule':
        result = {
          name: formValue.name,
          era: formValue.era,
          startYear: formValue.startYear ? Number(formValue.startYear) : null,
          endYear: formValue.endYear ? Number(formValue.endYear) : null,
          description: formValue.description || null,
          origin: formValue.origin,
          destination: formValue.destination,
          transitCities: this.transitCitiesArray.value,
          typicalDurationDays: formValue.typicalDurationDays ? Number(formValue.typicalDurationDays) : null,
          minDurationDays: formValue.minDurationDays ? Number(formValue.minDurationDays) : null,
          maxDurationDays: formValue.maxDurationDays ? Number(formValue.maxDurationDays) : null,
          transportType: formValue.transportType,
          frequency: formValue.frequency || null,
          source: formValue.source || null,
          notes: formValue.notes || null
        };
        break;

      case 'city':
        result = {
          name: formValue.name,
          latitude: formValue.latitude ? Number(formValue.latitude) : null,
          longitude: formValue.longitude ? Number(formValue.longitude) : null,
          province: formValue.province || null,
          era: formValue.era,
          importance: formValue.importance,
          roles: this.getRolesFromForm(),
          description: formValue.description || null,
          source: formValue.source || null
        };
        break;

      case 'restricted':
        result = {
          name: formValue.name,
          era: formValue.era,
          startYear: formValue.startYear ? Number(formValue.startYear) : null,
          endYear: formValue.endYear ? Number(formValue.endYear) : null,
          restrictionType: formValue.restrictionType,
          areaType: formValue.areaType,
          locationNames: this.locationNamesArray.value,
          description: formValue.description || null,
          source: formValue.source || null
        };
        break;

      case 'duration':
        result = {
          fromCity: formValue.fromCity,
          toCity: formValue.toCity,
          era: formValue.era,
          transportType: formValue.transportType,
          typicalDays: Number(formValue.typicalDays),
          minDays: formValue.minDays ? Number(formValue.minDays) : null,
          maxDays: formValue.maxDays ? Number(formValue.maxDays) : null,
          source: formValue.source || null,
          notes: formValue.notes || null
        };
        break;
    }

    this.dialogRef.close({ ...result, isEdit: this.isEdit });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
