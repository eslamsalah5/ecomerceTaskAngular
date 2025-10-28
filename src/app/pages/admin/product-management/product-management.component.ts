import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models';
import { getPlaceholderImage } from '../../../shared/utils/image-utils';

@Component({
  selector: 'app-product-management',
  imports: [CommonModule, RouterModule],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.css',
})
export class ProductManagementComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  isLoading = true;
  errorMessage = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalCount = 0;
  hasPrevious = false;
  hasNext = false;

  private subscription = new Subscription();

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscription.add(
      this.productService
        .getProductsWithPagination(this.currentPage, this.pageSize)
        .subscribe({
          next: (response) => {
            this.products = response.data;
            this.currentPage = response.currentPage;
            this.totalPages = response.totalPages;
            this.totalCount = response.totalCount;
            this.hasPrevious = response.hasPrevious;
            this.hasNext = response.hasNext;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading products:', error);
            this.errorMessage = 'Failed to load products';
            this.isLoading = false;
          },
        })
    );
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.hasNext) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.hasPrevious) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxPagesToShow / 2)
    );
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  editProduct(productId: number): void {
    this.router.navigate(['/admin/products/edit', productId]);
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.subscription.add(
        this.productService.deleteProduct(product.id).subscribe({
          next: () => {
            alert('Product deleted successfully!');
            // Reload the current page or go to previous if current becomes empty
            if (this.products.length === 1 && this.currentPage > 1) {
              this.currentPage--;
            }
            this.loadProducts();
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            alert('Failed to delete product. Please try again.');
          },
        })
      );
    }
  }

  viewProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  addNewProduct(): void {
    this.router.navigate(['/admin/products/new']);
  }

  onImageError(event: any, product: Product): void {
    event.target.src = getPlaceholderImage(product.category);
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
