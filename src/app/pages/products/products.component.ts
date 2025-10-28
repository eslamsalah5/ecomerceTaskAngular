import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models';
import { getPlaceholderImage } from '../../shared/utils/image-utils';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;

  products: Product[] = [];

  currentPage = 1;
  pageSize = 12;
  totalPages = 0;
  totalCount = 0;
  hasPrevious = false;
  hasNext = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.subscriptions.add(
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
            this.loading = false;
          },
          error: (error) => {
            console.error('Failed to load products:', error);
            this.error = 'Failed to load products. Please try again.';
            this.loading = false;
          },
        })
    );
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  getDiscountedPrice(product: Product): number {
    // Backend now returns finalPrice calculated, so use it directly
    return product.finalPrice;
  }

  hasDiscount(product: Product): boolean {
    return !!(product.discountPercentage && product.discountPercentage > 0);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
        alert(`Added ${product.name} to cart successfully!`);
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        alert(error.error?.message || 'Failed to add item to cart');
      },
    });
  }

  toggleWishlist(product: Product): void {
    console.log(`Toggled wishlist for ${product.name}`);
    alert(`Wishlist feature coming soon!`);
  }

  retryLoad(): void {
    this.loadProducts();
  }

  onImageError(event: any, product: Product): void {
    event.target.src = getPlaceholderImage(product.category);
  }
}
