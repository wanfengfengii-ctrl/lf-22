import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { LetterService } from '../../services/letter.service';
import { ConfidenceService } from '../../services/confidence.service';
import { Letter } from '../../models/letter.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-letter-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule, MatDialogModule, MatChipsModule, MatProgressBarModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>信件管理</h1>
      <div class="header-actions">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>搜索信件</mat-label>
          <input matInput [(ngModel)]="searchQuery" placeholder="输入关键词搜索">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <button mat-raised-button color="primary" (click)="createLetter()">
          <mat-icon>add</mat-icon>
          新建信件
        </button>
      </div>
    </div>

    <div class="letter-grid" *ngIf="filteredLetters.length > 0">
      <mat-card *ngFor="let letter of filteredLetters" class="letter-card">
        <mat-card-header>
          <mat-card-title>{{ letter.title }}</mat-card-title>
          <mat-card-subtitle>
            <span class="version-count">
              <mat-icon>route</mat-icon>
              {{ getVersionCount(letter) }} 个方案
            </span>
            <span class="official-badge" *ngIf="getOfficialVersion(letter)">
              <mat-icon>star</mat-icon>
              正式方案：{{ getOfficialVersion(letter)?.name }}
            </span>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p *ngIf="letter.description" class="description">{{ letter.description }}</p>
          <div class="postmark-info">
            <span class="info-item">
              <mat-icon>place</mat-icon>
              {{ getOriginName(letter) }}
            </span>
            <mat-icon class="arrow">arrow_forward</mat-icon>
            <span class="info-item">
              <mat-icon>flag</mat-icon>
              {{ getDestinationName(letter) }}
            </span>
          </div>
          <div class="confidence-preview" *ngIf="getOfficialConfidence(letter) !== null">
            <div class="confidence-header">
              <span class="confidence-label">正式方案可信度</span>
              <span
                class="confidence-value"
                [style.color]="confidenceService.getConfidenceColor(getOfficialConfidence(letter) || 0)"
              >
                {{ getOfficialConfidence(letter) }}%
              </span>
            </div>
            <mat-progress-bar
              mode="determinate"
              [value]="getOfficialConfidence(letter) || 0"
              [color]="getConfidenceProgressColor(letter)"
            ></mat-progress-bar>
          </div>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-button color="primary" (click)="viewMap(letter.id)">
            <mat-icon>map</mat-icon>
            查看路线
          </button>
          <button mat-button (click)="editLetter(letter.id)">
            <mat-icon>edit</mat-icon>
            编辑
          </button>
          <button mat-button color="warn" (click)="deleteLetter(letter.id)">
            <mat-icon>delete</mat-icon>
            删除
          </button>
        </mat-card-actions>
      </mat-card>
    </div>

    <div class="empty-state" *ngIf="filteredLetters.length === 0">
      <mat-icon class="empty-icon">mail_outline</mat-icon>
      <h3>{{ letters.length === 0 ? '还没有信件记录' : '没有找到匹配的信件' }}</h3>
      <p>{{ letters.length === 0 ? '点击"新建信件"开始录入第一封信' : '尝试使用其他关键词搜索' }}</p>
      <button mat-raised-button color="primary" (click)="createLetter()" *ngIf="letters.length === 0">
        <mat-icon>add</mat-icon>
        新建信件
      </button>
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
      gap: 16px;
      align-items: center;
    }
    .search-field {
      width: 300px;
    }
    .letter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .letter-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .letter-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }
    .description {
      color: #666;
      margin: 8px 0 16px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .postmark-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 0.9em;
      margin-bottom: 12px;
    }
    .info-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .arrow {
      color: #999;
    }
    .version-count {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
    }
    .version-count mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .official-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: #1976d2;
      margin-top: 4px;
    }
    .official-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .confidence-preview {
      padding-top: 12px;
      border-top: 1px solid #eee;
    }
    .confidence-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .confidence-header .confidence-label {
      font-size: 0.85rem;
      color: #666;
    }
    .confidence-header .confidence-value {
      font-weight: bold;
      font-size: 0.9rem;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }
    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #666;
    }
    .empty-state p {
      margin: 0 0 24px 0;
    }
    mat-icon {
      vertical-align: middle;
    }
  `]
})
export class LetterListComponent implements OnInit {
  letters: Letter[] = [];
  searchQuery = '';

  constructor(
    private letterService: LetterService,
    public confidenceService: ConfidenceService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.letterService.letters$.subscribe(letters => {
      this.letters = letters;
    });
  }

  get filteredLetters(): Letter[] {
    if (!this.searchQuery.trim()) {
      return this.letters;
    }
    const query = this.searchQuery.toLowerCase();
    return this.letters.filter(l =>
      l.title.toLowerCase().includes(query) ||
      (l.description && l.description.toLowerCase().includes(query)) ||
      l.postmarks.some(p => p.locationName.toLowerCase().includes(query))
    );
  }

  getOriginName(letter: Letter): string {
    const postmarks = this.getActivePostmarks(letter);
    const origin = postmarks.find(p => p.type === 'origin');
    return origin?.locationName || '未知';
  }

  getDestinationName(letter: Letter): string {
    const postmarks = this.getActivePostmarks(letter);
    const dest = postmarks.find(p => p.type === 'destination');
    return dest?.locationName || '未知';
  }

  getVersionCount(letter: Letter): number {
    return letter.versions?.length || (letter.postmarks.length > 0 ? 1 : 0);
  }

  getOfficialVersion(letter: Letter): any {
    if (letter.versions && letter.versions.length > 0) {
      if (letter.officialVersionId) {
        return letter.versions.find(v => v.id === letter.officialVersionId);
      }
      return letter.versions.find(v => v.isOfficial) || letter.versions[0];
    }
    return null;
  }

  private getActivePostmarks(letter: Letter): any[] {
    const official = this.getOfficialVersion(letter);
    if (official) return official.postmarks;
    return letter.postmarks || [];
  }

  getOfficialConfidence(letter: Letter): number | null {
    const official = this.getOfficialVersion(letter);
    if (!official || !official.postmarks || official.postmarks.length === 0) return null;
    return this.confidenceService.calculateConfidence(official.postmarks).percentage;
  }

  getConfidenceProgressColor(letter: Letter): 'primary' | 'accent' | 'warn' {
    const conf = this.getOfficialConfidence(letter);
    if (conf === null) return 'primary';
    if (conf >= 70) return 'primary';
    if (conf >= 40) return 'accent';
    return 'warn';
  }

  createLetter(): void {
    this.router.navigate(['/letters/new']);
  }

  editLetter(id: string): void {
    this.router.navigate(['/letters', id, 'edit']);
  }

  viewMap(id: string): void {
    this.router.navigate(['/letters', id, 'map']);
  }

  deleteLetter(id: string): void {
    const letter = this.letterService.getLetterById(id);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '删除信件',
        message: `确定要删除"${letter?.title}"吗？此操作无法撤销。`,
        confirmText: '删除',
        cancelText: '取消'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.letterService.deleteLetter(id);
      }
    });
  }
}
