import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <span class="title">邮政史研究工具</span>
      <span class="spacer"></span>
      <a mat-button routerLink="/letters" routerLinkActive="active">
        <mat-icon>mail</mat-icon>
        信件管理
      </a>
      <a mat-button routerLink="/statistics" routerLinkActive="active">
        <mat-icon>bar_chart</mat-icon>
        统计分析
      </a>
    </mat-toolbar>
    <div class="content">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .title {
      font-size: 1.25rem;
      font-weight: 600;
    }
    .spacer {
      flex: 1;
    }
    .content {
      padding: 24px;
      min-height: calc(100vh - 64px);
      background: #f5f0e1;
    }
    .active {
      background: rgba(255,255,255,0.2);
    }
    a {
      margin-left: 8px;
      border-radius: 4px;
    }
    mat-icon {
      margin-right: 8px;
      vertical-align: middle;
    }
  `]
})
export class LayoutComponent {}
