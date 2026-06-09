import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { LetterListComponent } from './components/letter-list/letter-list.component';
import { LetterEditComponent } from './components/letter-edit/letter-edit.component';
import { RouteMapComponent } from './components/route-map/route-map.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { KnowledgeBaseComponent } from './components/knowledge-base/knowledge-base.component';
import { EraAnalysisComponent } from './components/era-analysis/era-analysis.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'letters', pathMatch: 'full' },
      { path: 'letters', component: LetterListComponent },
      { path: 'letters/new', component: LetterEditComponent },
      { path: 'letters/:id/edit', component: LetterEditComponent },
      { path: 'letters/:id/map', component: RouteMapComponent },
      { path: 'statistics', component: StatisticsComponent },
      { path: 'knowledge', component: KnowledgeBaseComponent },
      { path: 'era-analysis', component: EraAnalysisComponent },
      { path: '**', redirectTo: 'letters' }
    ]
  }
];
