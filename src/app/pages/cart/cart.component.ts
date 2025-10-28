import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { Cart, CartItem } from '../../models/cart.models';
import { getSafeImageUrl } from '../../shared/utils/image-utils';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  loading = false;
  updatingItems = new Set<number>();
  private destroy$ = new Subject<void>();

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    this.cartService.cart$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (cart) => {
        this.cart = cart;
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hasItems(): boolean {
    return !!(this.cart && this.cart.items && this.cart.items.length > 0);
  }

  incrementQuantity(item: CartItem): void {
    if (this.updatingItems.has(item.productId)) return;

    this.updatingItems.add(item.productId);
    this.cartService.incrementItem(item.productId).subscribe({
      next: () => {
        this.updatingItems.delete(item.productId);
      },
      error: (error: any) => {
        this.updatingItems.delete(item.productId);
        console.error('Error incrementing item:', error);
        alert(error.error?.message || 'Failed to update item quantity');
      },
    });
  }

  decrementQuantity(item: CartItem): void {
    if (this.updatingItems.has(item.productId)) return;

    this.updatingItems.add(item.productId);
    this.cartService.decrementItem(item.productId).subscribe({
      next: () => {
        this.updatingItems.delete(item.productId);
      },
      error: (error) => {
        this.updatingItems.delete(item.productId);
        console.error('Error decrementing item:', error);
        alert(error.error?.message || 'Failed to update item quantity');
      },
    });
  }

  removeItem(item: CartItem): void {
    if (this.updatingItems.has(item.productId)) return;

    if (!confirm(`Remove ${item.name} from cart?`)) return;

    this.updatingItems.add(item.productId);
    this.cartService.removeItem(item.productId).subscribe({
      next: () => {
        this.updatingItems.delete(item.productId);
      },
      error: (error) => {
        this.updatingItems.delete(item.productId);
        console.error('Error removing item:', error);
        alert(error.error?.message || 'Failed to remove item from cart');
      },
    });
  }

  clearCart(): void {
    if (!confirm('Are you sure you want to clear your cart?')) return;

    this.loading = true;
    this.cartService.clearCart().subscribe({
      next: () => {
        this.loading = false;
        alert('Cart cleared successfully');
      },
      error: (error) => {
        this.loading = false;
        console.error('Error clearing cart:', error);
        alert(error.error?.message || 'Failed to clear cart');
      },
    });
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  proceedToCheckout(): void {
    alert('Checkout feature coming soon!');
  }

  getItemImage(item: CartItem): string {
    return getSafeImageUrl(item.imageUrl, 'Other');
  }

  hasDiscount(item: CartItem): boolean {
    return !!(item.discountPercentage && item.discountPercentage > 0);
  }

  getOriginalPrice(item: CartItem): number {
    // unitPrice is the ORIGINAL price (before discount)
    return item.unitPrice;
  }

  getFinalPrice(item: CartItem): number {
    if (!this.hasDiscount(item)) return item.unitPrice;
    // Calculate final price after discount
    const discountAmount = item.unitPrice * (item.discountPercentage! / 100);
    return item.unitPrice - discountAmount;
  }

  isUpdating(item: CartItem): boolean {
    return this.updatingItems.has(item.productId);
  }

  onImageError(event: any): void {
    event.target.src = getSafeImageUrl(null, 'Other');
  }
}
