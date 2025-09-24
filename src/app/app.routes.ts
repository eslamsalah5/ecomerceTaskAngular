import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProductsComponent } from './pages/products/products.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';
import { ProductManagementComponent } from './pages/admin/product-management/product-management.component';
import { ProductFormComponent } from './pages/admin/product-form/product-form.component';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'products', component: ProductsComponent, canActivate: [authGuard] },
  {
    path: 'product/:id',
    component: ProductDetailComponent,
    canActivate: [authGuard],
  },
  // Admin routes
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin/products',
    component: ProductManagementComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin/products/new',
    component: ProductFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin/products/edit/:id',
    component: ProductFormComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/home' },
];
