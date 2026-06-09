import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LetterService } from '../../services/letter.service';
import { ValidationService } from '../../services/validation.service';
import { ConfidenceService } from '../../services/confidence.service';
import { PostmarkType, PostmarkClarity, ValidationResult, RouteVersion, ConfidenceScore, LocationPrecision } from '../../models/letter.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-letter-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatExpansionModule,
    MatListModule,
    MatSnackBarModule,
    MatTabsModule,
    MatDialogModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-header">
      <button mat-button (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        返回列表
      </button>
      <h1>{{ isEdit ? '编辑信件' : '新建信件' }}</h1>
      <div class="header-actions">
        <button mat-button (click)="resetForm()" *ngIf="isEdit">
          <mat-icon>refresh</mat-icon>
          重置
        </button>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="!letterForm.valid">
          <mat-icon>save</mat-icon>
          保存
        </button>
      </div>
    </div>

    <div class="edit-container" [formGroup]="letterForm">
      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>基本信息</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>信件标题</mat-label>
            <input matInput formControlName="title" placeholder="请输入信件标题">
            <mat-error *ngIf="letterForm.get('title')?.hasError('required')">
              标题不能为空
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>描述</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="信件相关描述信息"></textarea>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <mat-card class="versions-card">
        <mat-card-header>
          <mat-card-title>邮路方案</mat-card-title>
          <button mat-raised-button color="primary" (click)="addVersion()">
            <mat-icon>add</mat-icon>
            新建方案
          </button>
        </mat-card-header>
        <mat-card-content>
          <div class="version-list" *ngIf="versions.length > 0">
            <div
              class="version-item"
              *ngFor="let version of versions; let i = index"
              [class.active]="selectedVersionIndex === i"
              [class.official]="version.isOfficial"
              (click)="selectVersion(i)"
            >
              <div class="version-header">
                <div class="version-title">
                  <mat-icon *ngIf="version.isOfficial" class="official-icon" color="primary">star</mat-icon>
                  <span class="version-name">{{ version.name || '未命名方案' }}</span>
                </div>
                <div class="version-actions" (click)="$event.stopPropagation()">
                  <button
                    mat-icon-button
                    color="primary"
                    *ngIf="!version.isOfficial"
                    (click)="setAsOfficial(i)"
                    matTooltip="设为正式方案"
                  >
                    <mat-icon>star_border</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    (click)="duplicateVersion(i)"
                    matTooltip="复制方案"
                  >
                    <mat-icon>content_copy</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    *ngIf="versions.length > 1"
                    (click)="deleteVersion(i)"
                    matTooltip="删除方案"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              <div class="version-info">
                <span class="version-desc">{{ version.description || '无描述' }}</span>
                <span class="version-stats">
                  {{ getVersionPostmarkCount(version) }} 个邮戳
                </span>
              </div>
              <div class="confidence-bar" *ngIf="getVersionConfidence(version)">
                <div class="confidence-header">
                  <span class="confidence-label">可信度</span>
                  <span class="confidence-value" [style.color]="getConfidenceColor(version)">
                    {{ getVersionConfidence(version)?.percentage }}%
                    ({{ confidenceService.getConfidenceLabel(getVersionConfidence(version)?.percentage || 0) }})
                  </span>
                </div>
                <mat-progress-bar
                  mode="determinate"
                  [value]="getVersionConfidence(version)?.percentage || 0"
                  [color]="getConfidenceProgressColor(version)"
                ></mat-progress-bar>
              </div>
            </div>
          </div>
          <div class="empty-versions" *ngIf="versions.length === 0">
            <mat-icon>route</mat-icon>
            <p>暂无邮路方案</p>
            <button mat-raised-button color="primary" (click)="addVersion()">
              创建第一个方案
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <ng-container *ngIf="selectedVersion && selectedVersionForm">
        <mat-card class="version-detail-card">
          <mat-card-header>
            <mat-card-title>方案详情 - {{ selectedVersion.name || '未命名方案' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content [formGroup]="selectedVersionForm">
            <div class="version-meta">
              <mat-form-field appearance="outline">
                <mat-label>方案名称</mat-label>
                <input matInput formControlName="name" placeholder="请输入方案名称">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>方案描述</mat-label>
                <textarea matInput formControlName="description" rows="2" placeholder="方案的推断依据、参考资料等"></textarea>
              </mat-form-field>
            </div>

            <div class="confidence-detail" *ngIf="currentConfidence">
              <h4>可信度分析</h4>
              <div class="confidence-score-big">
                <span class="score-number" [style.color]="confidenceService.getConfidenceColor(currentConfidence.percentage)">
                  {{ currentConfidence.percentage }}%
                </span>
                <span class="score-label">
                  {{ confidenceService.getConfidenceLabel(currentConfidence.percentage) }}
                </span>
              </div>
              <div class="confidence-breakdown">
                <div class="breakdown-item" *ngFor="let item of confidenceBreakdownItems">
                  <div class="breakdown-header">
                    <span class="breakdown-label">{{ item.label }}</span>
                    <span class="breakdown-value">{{ item.score }} / {{ item.max }}</span>
                  </div>
                  <div class="breakdown-bar">
                    <div
                      class="breakdown-fill"
                      [style.width.%]="item.max > 0 ? (item.score / item.max) * 100 : 0"
                      [style.background]="item.color"
                    ></div>
                  </div>
                  <ul class="breakdown-details" *ngIf="item.details.length > 0">
                    <li *ngFor="let detail of item.details">{{ detail }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="postmarks-card">
          <mat-card-header>
            <mat-card-title>邮戳信息</mat-card-title>
            <button mat-icon-button color="primary" (click)="addTransitPostmark()" matTooltip="添加中转邮戳">
              <mat-icon>add</mat-icon>
            </button>
          </mat-card-header>
          <mat-card-content>
            <div class="postmark-list" formArrayName="postmarks">
              <div
                class="postmark-item origin"
                *ngFor="let pm of postmarksFormArray.controls; let i = index"
                [formGroupName]="i"
                [class.transit]="getPostmarkType(i) === 'transit'"
                [class.destination]="getPostmarkType(i) === 'destination'"
              >
                <div class="postmark-header">
                  <span class="postmark-badge" [ngClass]="getPostmarkType(i) + '-badge'">
                    {{ getPostmarkBadgeLabel(i) }}
                  </span>
                  <span class="postmark-title">
                    {{ postmarksFormArray.at(i).get('locationName')?.value || '未命名' }}
                  </span>
                  <button
                    mat-icon-button
                    color="warn"
                    class="delete-btn"
                    *ngIf="getPostmarkType(i) === 'transit'"
                    (click)="removeTransitPostmark(i)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                <div class="postmark-fields">
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>地点名称</mat-label>
                      <input matInput formControlName="locationName">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>位置精度</mat-label>
                      <mat-select formControlName="locationPrecision">
                        <mat-option value="exact">精确</mat-option>
                        <mat-option value="approximate">近似</mat-option>
                        <mat-option value="unknown">未知</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>纬度</mat-label>
                      <input matInput type="number" formControlName="latitude" step="0.0001">
                      <mat-error *ngIf="postmarksFormArray.at(i).get('latitude')?.hasError('invalidLatitude')">
                        纬度应在 -90 到 90 之间
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>经度</mat-label>
                      <input matInput type="number" formControlName="longitude" step="0.0001">
                      <mat-error *ngIf="postmarksFormArray.at(i).get('longitude')?.hasError('invalidLongitude')">
                        经度应在 -180 到 180 之间
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>邮戳日期</mat-label>
                      <input matInput [matDatepicker]="picker" formControlName="postmarkDate">
                      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                      <mat-datepicker #picker></mat-datepicker>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>清晰度</mat-label>
                      <mat-select formControlName="clarity">
                        <mat-option value="clear">清晰</mat-option>
                        <mat-option value="partial">部分清晰</mat-option>
                        <mat-option value="fuzzy">模糊</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>备注</mat-label>
                      <input matInput formControlName="notes">
                    </mat-form-field>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="validation-card" *ngIf="validationResult">
          <mat-card-header>
            <mat-card-title>验证结果</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="validation-errors" *ngIf="validationResult.errors.length > 0">
              <h4><mat-icon color="warn">error</mat-icon> 错误 ({{ validationResult.errors.length }})</h4>
              <ul>
                <li *ngFor="let error of validationResult.errors" class="error-item">
                  {{ error.message }}
                </li>
              </ul>
            </div>

            <div class="validation-warnings" *ngIf="validationResult.warnings.length > 0">
              <h4><mat-icon color="accent">warning</mat-icon> 警告 ({{ validationResult.warnings.length }})</h4>
              <ul>
                <li *ngFor="let warning of validationResult.warnings" class="warning-item">
                  {{ warning.message }}
                </li>
              </ul>
            </div>

            <div class="validation-success" *ngIf="validationResult.valid && validationResult.warnings.length === 0">
              <mat-icon color="primary">check_circle</mat-icon>
              <span>所有验证通过</span>
            </div>

            <div class="route-map-status">
              <span *ngIf="canGenerateRoute" class="status-ok">
                <mat-icon>map</mat-icon>
                可以生成流转路线图
              </span>
              <span *ngIf="!canGenerateRoute" class="status-error">
                <mat-icon>map_off</mat-icon>
                无法生成流转路线图（存在时间倒序或缺少起止点）
              </span>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .page-header h1 {
      margin: 0;
      color: #5d4037;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }
    .edit-container {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .full-width {
      width: 100%;
    }
    .versions-card mat-card-header,
    .postmarks-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .version-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .version-item {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .version-item:hover {
      border-color: #8d6e63;
      background: #fafafa;
    }
    .version-item.active {
      border-color: #5d4037;
      background: #efebe9;
    }
    .version-item.official {
      border-color: #1976d2;
    }
    .version-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .version-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .official-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .version-name {
      font-weight: 600;
      font-size: 1rem;
      color: #5d4037;
    }
    .version-actions {
      display: flex;
      gap: 4px;
    }
    .version-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #666;
      font-size: 0.85rem;
      margin-bottom: 12px;
    }
    .version-desc {
      flex: 1;
    }
    .version-stats {
      background: #eee;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .confidence-bar {
      margin-top: 8px;
    }
    .confidence-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      margin-bottom: 4px;
    }
    .confidence-label {
      color: #666;
    }
    .confidence-value {
      font-weight: 600;
    }
    .empty-versions {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }
    .empty-versions mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    .version-meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .version-meta .full-width {
      width: 100%;
    }
    .confidence-detail {
      border-top: 1px solid #e0e0e0;
      padding-top: 20px;
    }
    .confidence-detail h4 {
      margin: 0 0 16px 0;
      color: #5d4037;
    }
    .confidence-score-big {
      text-align: center;
      margin-bottom: 20px;
    }
    .score-number {
      font-size: 3rem;
      font-weight: bold;
      display: block;
    }
    .score-label {
      font-size: 1rem;
      color: #666;
    }
    .confidence-breakdown {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .breakdown-item {
      background: #fafafa;
      padding: 12px;
      border-radius: 8px;
    }
    .breakdown-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      margin-bottom: 6px;
    }
    .breakdown-label {
      font-weight: 500;
    }
    .breakdown-value {
      color: #666;
    }
    .breakdown-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .breakdown-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;
    }
    .breakdown-details {
      margin: 0;
      padding-left: 16px;
      font-size: 0.8rem;
      color: #e65100;
    }
    .breakdown-details li {
      margin-bottom: 2px;
    }
    .postmark-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .postmark-item {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }
    .postmark-item.origin {
      border-color: #4caf50;
    }
    .postmark-item.transit {
      border-color: #ff9800;
    }
    .postmark-item.destination {
      border-color: #f44336;
    }
    .postmark-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #fafafa;
    }
    .postmark-item.origin .postmark-header {
      background: #e8f5e9;
    }
    .postmark-item.transit .postmark-header {
      background: #fff3e0;
    }
    .postmark-item.destination .postmark-header {
      background: #ffebee;
    }
    .postmark-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }
    .origin-badge {
      background: #4caf50;
    }
    .transit-badge {
      background: #ff9800;
    }
    .destination-badge {
      background: #f44336;
    }
    .postmark-title {
      font-weight: 500;
      flex: 1;
    }
    .delete-btn {
      margin-left: auto;
    }
    .postmark-fields {
      padding: 16px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .form-grid .full-width {
      grid-column: 1 / -1;
    }
    .validation-card {
      border-left: 4px solid;
    }
    .validation-errors h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      margin: 0 0 8px 0;
    }
    .validation-warnings h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ff9800;
      margin: 0 0 8px 0;
    }
    .error-item {
      color: #d32f2f;
    }
    .warning-item {
      color: #f57c00;
    }
    .validation-success {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #388e3c;
    }
    .route-map-status {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-ok {
      color: #388e3c;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-error {
      color: #d32f2f;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class LetterEditComponent implements OnInit {
  letterForm!: FormGroup;
  isEdit = false;
  letterId: string | null = null;
  validationResult: ValidationResult | null = null;
  selectedVersionIndex = 0;
  currentConfidence: ConfidenceScore | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private letterService: LetterService,
    private validationService: ValidationService,
    public confidenceService: ConfidenceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.letterId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!(this.letterId && this.route.snapshot.routeConfig?.path?.includes('edit'));

    if (this.isEdit && this.letterId) {
      this.loadLetter(this.letterId);
    } else {
      this.addInitialVersion();
    }

    this.letterForm.valueChanges.subscribe(() => {
      this.onFormChanged();
    });

    this.onFormChanged();
  }

  get versions(): RouteVersion[] {
    const versions = this.letterForm.get('versions')?.value as any[];
    return versions || [];
  }

  get selectedVersion(): any {
    const versions = this.letterForm.get('versions') as FormArray;
    if (versions && this.selectedVersionIndex >= 0 && this.selectedVersionIndex < versions.length) {
      return versions.at(this.selectedVersionIndex).value;
    }
    return null;
  }

  get selectedVersionForm(): FormGroup | null {
    const versions = this.letterForm.get('versions') as FormArray;
    if (versions && this.selectedVersionIndex >= 0 && this.selectedVersionIndex < versions.length) {
      return versions.at(this.selectedVersionIndex) as FormGroup;
    }
    return null;
  }

  get postmarksFormArray(): FormArray {
    return this.selectedVersionForm?.get('postmarks') as FormArray;
  }

  get versionsFormArray(): FormArray {
    return this.letterForm.get('versions') as FormArray;
  }

  get confidenceBreakdownItems(): any[] {
    if (!this.currentConfidence) return [];
    const b = this.currentConfidence.breakdown;
    return [
      { label: '邮戳清晰度', score: b.clarity.score, max: b.clarity.max, details: b.clarity.details, color: '#4caf50' },
      { label: '日期完整性', score: b.dateCompleteness.score, max: b.dateCompleteness.max, details: b.dateCompleteness.details, color: '#2196f3' },
      { label: '地点精确性', score: b.locationPrecision.score, max: b.locationPrecision.max, details: b.locationPrecision.details, color: '#9c27b0' },
      { label: '时间顺序', score: b.temporalOrder.score, max: b.temporalOrder.max, details: b.temporalOrder.details, color: '#ff9800' },
      { label: '路线连续性', score: b.routeContinuity.score, max: b.routeContinuity.max, details: b.routeContinuity.details, color: '#795548' }
    ];
  }

  private createForm(): void {
    this.letterForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      versions: this.fb.array([]),
      officialVersionId: ['']
    });
  }

  private createVersionForm(version?: Partial<RouteVersion>): FormGroup {
    const postmarks = version?.postmarks || [];
    const postmarkFormArray = this.fb.array(
      postmarks.map((pm: any) => this.createPostmarkForm(pm))
    );

    return this.fb.group({
      id: [version?.id || ''],
      name: [version?.name || ''],
      description: [version?.description || ''],
      isOfficial: [version?.isOfficial || false],
      postmarks: postmarkFormArray
    });
  }

  private createPostmarkForm(postmark?: any): FormGroup {
    return this.fb.group({
      id: [postmark?.id || ''],
      type: [postmark?.type || 'transit'],
      locationName: [postmark?.locationName || ''],
      latitude: [postmark?.latitude ?? null, [this.latitudeValidator.bind(this)]],
      longitude: [postmark?.longitude ?? null, [this.longitudeValidator.bind(this)]],
      postmarkDate: [postmark?.postmarkDate ? new Date(postmark.postmarkDate) : null],
      clarity: [postmark?.clarity || 'clear'],
      notes: [postmark?.notes || ''],
      sequence: [postmark?.sequence ?? 0],
      locationPrecision: [postmark?.locationPrecision || 'exact']
    });
  }

  latitudeValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === '' || control.value === undefined) {
      return null;
    }
    const value = Number(control.value);
    if (isNaN(value) || value < -90 || value > 90) {
      return { invalidLatitude: true };
    }
    return null;
  }

  longitudeValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === '' || control.value === undefined) {
      return null;
    }
    const value = Number(control.value);
    if (isNaN(value) || value < -180 || value > 180) {
      return { invalidLongitude: true };
    }
    return null;
  }

  getPostmarkType(index: number): string {
    return this.postmarksFormArray.at(index).get('type')?.value || 'transit';
  }

  getPostmarkBadgeLabel(index: number): string {
    const type = this.getPostmarkType(index);
    if (type === 'origin') return '寄出地';
    if (type === 'destination') return '目的地';
    const transitIndex = this.getTransitIndex(index);
    return `中转 ${transitIndex + 1}`;
  }

  private getTransitIndex(globalIndex: number): number {
    let transitCount = 0;
    for (let i = 0; i <= globalIndex; i++) {
      if (this.getPostmarkType(i) === 'transit') {
        if (i === globalIndex) return transitCount;
        transitCount++;
      }
    }
    return -1;
  }

  getVersionPostmarkCount(version: any): number {
    return version.postmarks?.length || 0;
  }

  getVersionConfidence(version: any): ConfidenceScore | null {
    if (!version?.postmarks || version.postmarks.length === 0) return null;
    return this.confidenceService.calculateConfidence(version.postmarks);
  }

  getConfidenceColor(version: any): string {
    const conf = this.getVersionConfidence(version);
    if (!conf) return '#999';
    return this.confidenceService.getConfidenceColor(conf.percentage);
  }

  getConfidenceProgressColor(version: any): 'primary' | 'accent' | 'warn' {
    const conf = this.getVersionConfidence(version);
    if (!conf) return 'primary';
    if (conf.percentage >= 70) return 'primary';
    if (conf.percentage >= 40) return 'accent';
    return 'warn';
  }

  selectVersion(index: number): void {
    this.selectedVersionIndex = index;
    this.updateConfidence();
  }

  addVersion(): void {
    const newVersion = {
      name: `方案 ${this.versions.length + 1}`,
      description: '',
      isOfficial: false,
      postmarks: [
        { type: 'origin', locationName: '', latitude: null, longitude: null, postmarkDate: null, clarity: 'clear', notes: '', sequence: 0, locationPrecision: 'exact' },
        { type: 'destination', locationName: '', latitude: null, longitude: null, postmarkDate: null, clarity: 'clear', notes: '', sequence: 1, locationPrecision: 'exact' }
      ]
    };
    this.versionsFormArray.push(this.createVersionForm(newVersion as any));
    this.selectedVersionIndex = this.versions.length - 1;
    this.updateConfidence();
  }

  private addInitialVersion(): void {
    if (this.versions.length === 0) {
      this.addVersion();
    }
  }

  duplicateVersion(index: number): void {
    const sourceVersion = this.versions[index];
    const newPostmarks = sourceVersion.postmarks.map((p: any, i: number) => ({
      ...p,
      id: '',
      sequence: i
    }));
    const newVersion = {
      ...sourceVersion,
      id: '',
      name: `${sourceVersion.name} (副本)`,
      isOfficial: false,
      postmarks: newPostmarks
    };
    this.versionsFormArray.push(this.createVersionForm(newVersion as any));
    this.selectedVersionIndex = this.versions.length - 1;
    this.snackBar.open('方案已复制', '关闭', { duration: 2000 });
  }

  deleteVersion(index: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: {
        title: '确认删除',
        message: '确定要删除这个方案吗？此操作不可撤销。',
        confirmText: '删除',
        cancelText: '取消'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.versionsFormArray.removeAt(index);
        if (this.selectedVersionIndex >= this.versions.length) {
          this.selectedVersionIndex = this.versions.length - 1;
        }
        if (this.selectedVersionIndex < 0 && this.versions.length > 0) {
          this.selectedVersionIndex = 0;
        }
        this.updateConfidence();
        this.snackBar.open('方案已删除', '关闭', { duration: 2000 });
      }
    });
  }

  setAsOfficial(index: number): void {
    const versions = this.versionsFormArray;
    for (let i = 0; i < versions.length; i++) {
      versions.at(i).get('isOfficial')?.setValue(i === index);
    }
    this.letterForm.get('officialVersionId')?.setValue(this.versions[index].id || '');
    this.snackBar.open('已设为正式方案', '关闭', { duration: 2000 });
  }

  addTransitPostmark(): void {
    const postmarks = this.postmarksFormArray;
    const destIndex = postmarks.controls.findIndex(c => c.get('type')?.value === 'destination');
    const insertIndex = destIndex >= 0 ? destIndex : postmarks.length;
    const sequence = insertIndex;

    const newPostmark = this.createPostmarkForm({
      type: 'transit',
      locationName: '',
      latitude: null,
      longitude: null,
      postmarkDate: null,
      clarity: 'clear',
      notes: '',
      sequence,
      locationPrecision: 'exact'
    });

    postmarks.insert(insertIndex, newPostmark);
    this.resequencePostmarks();
  }

  removeTransitPostmark(index: number): void {
    this.postmarksFormArray.removeAt(index);
    this.resequencePostmarks();
  }

  private resequencePostmarks(): void {
    this.postmarksFormArray.controls.forEach((control, i) => {
      control.get('sequence')?.setValue(i);
    });
  }

  private loadLetter(id: string): void {
    const letter = this.letterService.getLetterById(id);
    if (letter) {
      this.letterForm.patchValue({
        title: letter.title,
        description: letter.description || '',
        officialVersionId: letter.officialVersionId || ''
      });

      while (this.versionsFormArray.length > 0) {
        this.versionsFormArray.removeAt(0);
      }

      const versions = letter.versions || [];
      if (versions.length === 0 && letter.postmarks.length > 0) {
        const defaultVersion = {
          id: '',
          name: '初始方案',
          description: '',
          isOfficial: true,
          postmarks: letter.postmarks
        };
        this.versionsFormArray.push(this.createVersionForm(defaultVersion as any));
      } else {
        for (const version of versions) {
          this.versionsFormArray.push(this.createVersionForm(version));
        }
      }

      this.selectedVersionIndex = 0;
      if (letter.officialVersionId) {
        const idx = versions.findIndex(v => v.id === letter.officialVersionId);
        if (idx >= 0) this.selectedVersionIndex = idx;
      }

      this.updateConfidence();
    }
  }

  private onFormChanged(): void {
    this.validateForm();
    this.updateConfidence();
  }

  private validateForm(): void {
    const letter = this.buildLetterFromForm();
    if (letter) {
      const selectedPostmarks = this.getSelectedVersionPostmarks();
      const fakeLetter = { ...letter, postmarks: selectedPostmarks };
      this.validationResult = this.validationService.validateLetter(fakeLetter as any);
    }
  }

  private updateConfidence(): void {
    const postmarks = this.getSelectedVersionPostmarks();
    if (postmarks.length > 0) {
      this.currentConfidence = this.confidenceService.calculateConfidence(postmarks);
    } else {
      this.currentConfidence = null;
    }
  }

  private getSelectedVersionPostmarks(): any[] {
    if (!this.selectedVersionForm) return [];
    const formValue = this.selectedVersionForm.value;
    return this.convertPostmarkDates(formValue.postmarks || []);
  }

  private convertPostmarkDates(postmarks: any[]): any[] {
    return postmarks.map((pm: any) => ({
      ...pm,
      postmarkDate: pm.postmarkDate ? pm.postmarkDate.toISOString?.().split('T')[0] || pm.postmarkDate : null
    }));
  }

  get canGenerateRoute(): boolean {
    const selectedPostmarks = this.getSelectedVersionPostmarks();
    const fakeLetter = { postmarks: selectedPostmarks } as any;
    return this.validationService.canGenerateRouteMap(fakeLetter);
  }

  private buildLetterFromForm(): any {
    if (!this.letterForm.valid) return null;

    const formValue = this.letterForm.value;
    const versions = formValue.versions.map((v: any, idx: number) => ({
      ...v,
      id: v.id || '',
      letterId: this.letterId || '',
      postmarks: this.convertPostmarkDates(v.postmarks || [])
    }));

    const officialVersion = versions.find((v: any) => v.isOfficial);

    return {
      id: this.letterId || '',
      title: formValue.title,
      description: formValue.description,
      postmarks: officialVersion?.postmarks || [],
      versions,
      officialVersionId: officialVersion?.id || formValue.officialVersionId
    };
  }

  save(): void {
    if (!this.letterForm.valid) return;

    const letterData = this.buildLetterFromForm();

    if (this.isEdit && this.letterId) {
      this.letterService.updateLetter(this.letterId, letterData);
      this.snackBar.open('信件已更新', '关闭', { duration: 3000 });
    } else {
      const newLetter = this.letterService.addLetter({
        title: letterData.title,
        description: letterData.description,
        postmarks: letterData.postmarks,
        versions: letterData.versions,
        officialVersionId: letterData.officialVersionId
      });
      this.snackBar.open('信件已创建', '关闭', { duration: 3000 });
      this.router.navigate(['/letters', newLetter.id, 'edit']);
      return;
    }

    this.router.navigate(['/letters']);
  }

  resetForm(): void {
    if (this.letterId) {
      this.loadLetter(this.letterId);
    }
  }

  goBack(): void {
    this.router.navigate(['/letters']);
  }
}
