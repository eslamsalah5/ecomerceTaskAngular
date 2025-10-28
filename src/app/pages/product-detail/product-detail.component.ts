import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
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
  addingToCart: boolean = false;
  currentImageUrl: string = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
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
            this.quantity = 1; // Start with quantity 1
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
    return !!(
      this.product &&
      this.product.discountPercentage &&
      this.product.discountPercentage > 0
    );
  }

  get discountedPrice(): number {
    if (!this.product) return 0;
    // Backend returns finalPrice already calculated
    return this.product.finalPrice;
  }

  get totalPrice(): number {
    return this.discountedPrice * this.quantity;
  }

  get savings(): number {
    if (!this.product || !this.hasDiscount) return 0;
    return (this.product.price - this.product.finalPrice) * this.quantity;
  }

  get maxQuantity(): number {
    return this.product?.stock || 10;
  }

  incrementQuantity(): void {
    if (this.quantity < this.maxQuantity) {
      this.quantity++;
    } else {
      // Show alert when trying to exceed stock
      alert(`Sorry, only ${this.maxQuantity} items available in stock!`);
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  onQuantityChange(): void {
    // Ensure quantity doesn't exceed stock
    if (this.quantity > this.maxQuantity) {
      this.quantity = this.maxQuantity;
      alert(`Maximum available quantity is ${this.maxQuantity}`);
    }
    // Ensure quantity is at least 1
    if (this.quantity < 1) {
      this.quantity = 1;
    }
  }

  addToCart(): void {
    if (!this.product || this.addingToCart) return;

    this.addingToCart = true;
    this.cartService.addToCart(this.product.id, this.quantity).subscribe({
      next: () => {
        this.addingToCart = false;
        alert(
          `Added ${this.quantity}x ${this.product!.name} to cart successfully!`
        );
      },
      error: (error) => {
        this.addingToCart = false;
        console.error('Error adding to cart:', error);
        alert(
          error.error?.message ||
            'Failed to add item to cart. Please try again.'
        );
      },
    });
  }

  buyNow(): void {
    if (!this.product) return;

    this.addToCart();
    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 500);
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
