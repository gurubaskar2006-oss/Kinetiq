import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { PoseDetector } from './pose-detector/pose-detector';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'camera', component: PoseDetector }
];
