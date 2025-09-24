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
  itemsPerPage = 10;
  totalItems = 0;

  // Make Math available in template
  Math = Math;

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
    this.subscription.add(
      this.productService.getAllProductsForAdmin().subscribe({
        next: (products) => {
          this.products = products;
          this.totalItems = products.length;
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

  getPaginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.products.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  editProduct(productId: number): void {
    this.router.navigate(['/admin/products/edit', productId]);
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.subscription.add(
        this.productService.deleteProduct(product.id).subscribe({
          next: () => {
            // Optimistically update the list without refetch
            const prevLength = this.products.length;
            this.products = this.products.filter((p) => p.id !== product.id);
            this.totalItems = this.products.length;

            // Adjust current page if it became empty
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            if (this.currentPage > 1 && startIndex >= this.totalItems) {
              this.currentPage = this.currentPage - 1;
            }

            alert('Product deleted successfully!');
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
