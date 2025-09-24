import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models';
import { getPlaceholderImage } from '../../shared/utils/image-utils';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit, OnDestroy {
  selectedCategory = '';
  loading = true;
  error: string | null = null;
  categories: string[] = [];

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadProducts(): void {
    this.loading = true;
    this.error = null;

    this.subscriptions.add(
      this.productService.getAllProducts(1, 50).subscribe({
        next: (products) => {
          // Ensure products is an array
          if (Array.isArray(products)) {
            this.allProducts = products;
            this.filteredProducts = [...products];
          } else {
            console.error('Products is not an array:', products);
            this.allProducts = [];
            this.filteredProducts = [];
          }
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

  private loadCategories(): void {
    this.subscriptions.add(
      this.productService.getCategories().subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Failed to load categories:', error);
        },
      })
    );
  }

  filterProducts(): void {
    this.filteredProducts = this.allProducts.filter((product) => {
      const matchesCategory =
        !this.selectedCategory ||
        product.category.toLowerCase() === this.selectedCategory.toLowerCase();

      return matchesCategory;
    });
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.filteredProducts = [...this.allProducts];
  }

  getDiscountedPrice(product: Product): number {
    if (product.discountRate && product.discountRate > 0) {
      return +(product.price * (1 - product.discountRate / 100)).toFixed(2);
    }
    return product.price;
  }

  addToCart(product: Product): void {
    // Here you would add to cart service
    console.log(`Added ${product.name} to cart`);
    alert(`Added ${product.name} to cart!`);
  }

  toggleWishlist(product: Product): void {
    // Here you would toggle wishlist service
    console.log(`Toggled wishlist for ${product.name}`);
    alert(`Added ${product.name} to wishlist!`);
  }

  retryLoad(): void {
    this.loadProducts();
  }

  onImageError(event: any, product: Product): void {
    event.target.src = getPlaceholderImage(product.category);
  }
}
