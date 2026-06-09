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
import { LetterService } from '../../services/letter.service';
import { ValidationService } from '../../services/validation.service';
import { PostmarkType, PostmarkClarity, ValidationResult } from '../../models/letter.model';

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
    MatSnackBarModule
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
        <button mat-raised-button color="primary" (click)="save()" [disabled]="!letterForm.valid || hasValidationErrors">
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

      <mat-card class="postmarks-card">
        <mat-card-header>
          <mat-card-title>邮戳信息</mat-card-title>
          <button mat-icon-button color="primary" (click)="addTransitPostmark()" matTooltip="添加中转邮戳">
            <mat-icon>add</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <div class="postmark-list">
            <div class="postmark-item origin" formGroupName="origin">
              <div class="postmark-header">
                <span class="postmark-badge origin-badge">寄出地</span>
                <span class="postmark-title">{{ originPostmark.get('locationName')?.value || '未命名' }}</span>
              </div>
              <div class="postmark-fields">
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>地点名称</mat-label>
                    <input matInput formControlName="locationName">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>纬度</mat-label>
                    <input matInput type="number" formControlName="latitude" step="0.0001">
                    <mat-error *ngIf="originPostmark.get('latitude')?.hasError('invalidLatitude')">
                      纬度应在 -90 到 90 之间
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>经度</mat-label>
                    <input matInput type="number" formControlName="longitude" step="0.0001">
                    <mat-error *ngIf="originPostmark.get('longitude')?.hasError('invalidLongitude')">
                      经度应在 -180 到 180 之间
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>邮戳日期</mat-label>
                    <input matInput [matDatepicker]="originDatePicker" formControlName="postmarkDate">
                    <mat-datepicker-toggle matSuffix [for]="originDatePicker"></mat-datepicker-toggle>
                    <mat-datepicker #originDatePicker></mat-datepicker>
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

            <ng-container formArrayName="transit">
              <div class="postmark-item transit" *ngFor="let _ of transitPostmarks.controls; let i = index" [formGroupName]="i">
                <div class="postmark-header">
                  <span class="postmark-badge transit-badge">中转 {{ i + 1 }}</span>
                  <span class="postmark-title">{{ getTransitPostmark(i).get('locationName')?.value || '未命名' }}</span>
                  <button mat-icon-button color="warn" class="delete-btn" (click)="removeTransitPostmark(i)">
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
                      <mat-label>纬度</mat-label>
                      <input matInput type="number" formControlName="latitude" step="0.0001">
                      <mat-error *ngIf="getTransitPostmark(i).get('latitude')?.hasError('invalidLatitude')">
                        纬度应在 -90 到 90 之间
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>经度</mat-label>
                      <input matInput type="number" formControlName="longitude" step="0.0001">
                      <mat-error *ngIf="getTransitPostmark(i).get('longitude')?.hasError('invalidLongitude')">
                        经度应在 -180 到 180 之间
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>邮戳日期</mat-label>
                      <input matInput [matDatepicker]="transitPicker" formControlName="postmarkDate">
                      <mat-datepicker-toggle matSuffix [for]="transitPicker"></mat-datepicker-toggle>
                      <mat-datepicker #transitPicker></mat-datepicker>
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
            </ng-container>

            <div class="postmark-item destination" formGroupName="destination">
              <div class="postmark-header">
                <span class="postmark-badge destination-badge">目的地</span>
                <span class="postmark-title">{{ destinationPostmark.get('locationName')?.value || '未命名' }}</span>
              </div>
              <div class="postmark-fields">
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>地点名称</mat-label>
                    <input matInput formControlName="locationName">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>纬度</mat-label>
                    <input matInput type="number" formControlName="latitude" step="0.0001">
                    <mat-error *ngIf="destinationPostmark.get('latitude')?.hasError('invalidLatitude')">
                      纬度应在 -90 到 90 之间
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>经度</mat-label>
                    <input matInput type="number" formControlName="longitude" step="0.0001">
                    <mat-error *ngIf="destinationPostmark.get('longitude')?.hasError('invalidLongitude')">
                      经度应在 -180 到 180 之间
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>邮戳日期</mat-label>
                    <input matInput [matDatepicker]="destDatePicker" formControlName="postmarkDate">
                    <mat-datepicker-toggle matSuffix [for]="destDatePicker"></mat-datepicker-toggle>
                    <mat-datepicker #destDatePicker></mat-datepicker>
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
    .postmarks-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private letterService: LetterService,
    private validationService: ValidationService,
    private snackBar: MatSnackBar
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.letterId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!(this.letterId && this.route.snapshot.routeConfig?.path?.includes('edit'));

    if (this.isEdit && this.letterId) {
      this.loadLetter(this.letterId);
    }

    this.letterForm.valueChanges.subscribe(() => {
      this.validateForm();
    });

    this.validateForm();
  }

  getTransitPostmark(index: number): FormGroup {
    return this.transitPostmarks.at(index) as FormGroup;
  }

  private createForm(): void {
    this.letterForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      origin: this.createPostmarkForm('origin'),
      transit: this.fb.array([]),
      destination: this.createPostmarkForm('destination')
    });
  }

  private createPostmarkForm(type: PostmarkType): FormGroup {
    return this.fb.group({
      type: [type],
      locationName: [''],
      latitude: [null as number | null, [this.latitudeValidator.bind(this)]],
      longitude: [null as number | null, [this.longitudeValidator.bind(this)]],
      postmarkDate: [null as Date | null],
      clarity: ['clear' as PostmarkClarity],
      notes: [''],
      sequence: [0]
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

  get originPostmark(): FormGroup {
    return this.letterForm.get('origin') as FormGroup;
  }

  get destinationPostmark(): FormGroup {
    return this.letterForm.get('destination') as FormGroup;
  }

  get transitPostmarks(): FormArray {
    return this.letterForm.get('transit') as FormArray;
  }

  addTransitPostmark(): void {
    const sequence = this.transitPostmarks.length + 1;
    const form = this.createPostmarkForm('transit');
    form.patchValue({ sequence });
    this.transitPostmarks.push(form);
  }

  removeTransitPostmark(index: number): void {
    this.transitPostmarks.removeAt(index);
    this.transitPostmarks.controls.forEach((control, i) => {
      (control as FormGroup).patchValue({ sequence: i + 1 });
    });
  }

  private loadLetter(id: string): void {
    const letter = this.letterService.getLetterById(id);
    if (letter) {
      this.letterForm.patchValue({
        title: letter.title,
        description: letter.description || ''
      });

      const origin = letter.postmarks.find(p => p.type === 'origin');
      if (origin) {
        this.originPostmark.patchValue({
          ...origin,
          postmarkDate: origin.postmarkDate ? new Date(origin.postmarkDate) : null
        });
      }

      const destination = letter.postmarks.find(p => p.type === 'destination');
      if (destination) {
        this.destinationPostmark.patchValue({
          ...destination,
          postmarkDate: destination.postmarkDate ? new Date(destination.postmarkDate) : null
        });
      }

      const transits = letter.postmarks
        .filter(p => p.type === 'transit')
        .sort((a, b) => a.sequence - b.sequence);

      while (this.transitPostmarks.length > 0) {
        this.transitPostmarks.removeAt(0);
      }

      for (const transit of transits) {
        const form = this.createPostmarkForm('transit');
        form.patchValue({
          ...transit,
          postmarkDate: transit.postmarkDate ? new Date(transit.postmarkDate) : null
        });
        this.transitPostmarks.push(form);
      }
    }
  }

  private validateForm(): void {
    const letter = this.buildLetterFromForm();
    if (letter) {
      this.validationResult = this.validationService.validateLetter(letter);
    }
  }

  get canGenerateRoute(): boolean {
    const letter = this.buildLetterFromForm();
    if (!letter) return false;
    return this.validationService.canGenerateRouteMap(letter);
  }

  get hasValidationErrors(): boolean {
    return this.validationResult ? this.validationResult.errors.length > 0 : false;
  }

  private buildLetterFromForm(): any {
    if (!this.letterForm.valid) return null;

    const formValue = this.letterForm.value;
    const postmarks = [];

    if (formValue.origin) {
      postmarks.push({
        ...formValue.origin,
        sequence: 0,
        postmarkDate: formValue.origin.postmarkDate ? formValue.origin.postmarkDate.toISOString().split('T')[0] : null
      });
    }

    formValue.transit.forEach((t: any, i: number) => {
      postmarks.push({
        ...t,
        sequence: i + 1,
        postmarkDate: t.postmarkDate ? t.postmarkDate.toISOString().split('T')[0] : null
      });
    });

    if (formValue.destination) {
      postmarks.push({
        ...formValue.destination,
        sequence: formValue.transit.length + 1,
        postmarkDate: formValue.destination.postmarkDate ? formValue.destination.postmarkDate.toISOString().split('T')[0] : null
      });
    }

    return {
      id: this.letterId || '',
      title: formValue.title,
      description: formValue.description,
      postmarks
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
        postmarks: letterData.postmarks.map((p: any) => ({
          ...p,
          letterId: '',
          id: ''
        }))
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
