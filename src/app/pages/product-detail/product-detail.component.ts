import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models';
import { getPlaceholderImage } from '../../shared/utils/image-utils';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  quantity: number = 1;
  loading: boolean = true;
  error: string | null = null;
  currentImageUrl: string = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.params.subscribe((params) => {
        const productId = +params['id'];
        this.loadProduct(productId);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadProduct(id: number): void {
    this.loading = true;
    this.error = null;

    this.subscriptions.add(
      this.productService.getProductById(id).subscribe({
        next: (product) => {
          if (product) {
            this.product = product;
            this.quantity = product.minimumQuantity || 1;
            this.currentImageUrl =
              product.imageUrl || getPlaceholderImage(product.category);
          } else {
            this.error = 'Product not found';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load product:', error);
          this.error = 'Failed to load product details.';
          this.loading = false;
        },
      })
    );
  }

  get hasDiscount(): boolean {
    return !!(this.product?.discountRate && this.product.discountRate > 0);
  }

  get discountedPrice(): number {
    if (!this.product) return 0;
    if (this.hasDiscount) {
      return this.product.price * (1 - this.product.discountRate! / 100);
    }
    return this.product.price;
  }

  get totalPrice(): number {
    return this.discountedPrice * this.quantity;
  }

  get savings(): number {
    if (!this.product || !this.hasDiscount) return 0;
    return (this.product.price - this.discountedPrice) * this.quantity;
  }

  get maxQuantity(): number {
    return 10; // Could be based on stock level
  }

  incrementQuantity(): void {
    if (this.quantity < this.maxQuantity) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    const minQty = this.product?.minimumQuantity || 1;
    if (this.quantity > minQty) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product) return;

    // Here you would call cart service
    console.log(`Adding ${this.quantity}x ${this.product.name} to cart`);

    // Show success message (you can implement toast notification)
    alert(`Added ${this.quantity}x ${this.product.name} to cart!`);
  }

  buyNow(): void {
    if (!this.product) return;

    // Here you would navigate to checkout with this product
    console.log(`Buy now: ${this.quantity}x ${this.product.name}`);
    alert('Redirecting to checkout...');
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  retryLoad(): void {
    const currentId = +this.route.snapshot.params['id'];
    if (currentId) {
      this.loadProduct(currentId);
    }
  }

  onImageError(event: any): void {
    const fallbackImage = getPlaceholderImage(this.product?.category);
    event.target.src = fallbackImage;
    this.currentImageUrl = fallbackImage;
  }
}
