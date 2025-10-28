import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { AuthService } from '../../../services/auth.service';
import { Product } from '../../../models';
import { getPlaceholderImage } from '../../../shared/utils/image-utils';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  totalProducts = 0;
  recentProducts: Product[] = [];
  isLoading = true;
  errorMessage = '';

  private subscription = new Subscription();

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.subscription.add(
      this.productService.getProductsWithPagination(1, 100).subscribe({
        next: (response) => {
          this.products = response.data;
          this.totalProducts = response.totalCount;
          // Get last 5 products as recent
          this.recentProducts = response.data.slice(-5).reverse();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          this.errorMessage = 'Failed to load dashboard data';
          this.isLoading = false;
        },
      })
    );
  }

  getProductsByCategory(): { [category: string]: number } {
    const categoryCount: { [category: string]: number } = {};
    this.products.forEach((product) => {
      categoryCount[product.category] =
        (categoryCount[product.category] || 0) + 1;
    });
    return categoryCount;
  }

  getTotalValue(): number {
    return this.products.reduce((total, product) => total + product.price, 0);
  }

  getAveragePrice(): number {
    if (this.products.length === 0) return 0;
    return this.getTotalValue() / this.products.length;
  }

  getCategoriesCount(): number {
    return Object.keys(this.getProductsByCategory()).length;
  }

  onImageError(event: any, product: Product): void {
    event.target.src = getPlaceholderImage(product.category);
  }
}
