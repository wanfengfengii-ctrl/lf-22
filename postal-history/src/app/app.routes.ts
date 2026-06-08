import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { LetterListComponent } from './components/letter-list/letter-list.component';
import { LetterEditComponent } from './components/letter-edit/letter-edit.component';
import { RouteMapComponent } from './components/route-map/route-map.component';
import { StatisticsComponent } from './components/statistics/statistics.component';

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
      { path: '**', redirectTo: 'letters' }
    ]
  }
];
