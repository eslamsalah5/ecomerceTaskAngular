import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import {
  ApiResponse,
  Cart,
  CartItem,
  AddToCartRequest,
  UpdateCartItemRequest,
} from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly apiUrl = `${environment.apiUrl}/Cart`;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  private cartItemCountSubject = new BehaviorSubject<number>(0);

  public cart$ = this.cartSubject.asObservable();
  public cartItemCount$ = this.cartItemCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  get currentCart(): Cart | null {
    return this.cartSubject.value;
  }

  get cartItemCount(): number {
    return this.cartItemCountSubject.value;
  }

  loadCart(): void {
    this.getCart().subscribe();
  }

  private getCart(): Observable<Cart> {
    return this.http.get<ApiResponse<Cart>>(this.apiUrl).pipe(
      map((response) => {
        if (response && response.success && response.data) {
          return response.data;
        }
        return this.getEmptyCart();
      }),
      catchError(() => {
        return [this.getEmptyCart()];
      }),
      tap((cart) => {
        this.cartSubject.next(cart);
        this.cartItemCountSubject.next(cart.totalItems);
      })
    );
  }

  addToCart(productId: number, quantity: number = 1): Observable<Cart> {
    const request: AddToCartRequest = { productId, quantity };

    return this.http
      .post<ApiResponse<Cart>>(`${this.apiUrl}/items`, request)
      .pipe(
        map((response) => {
          if (response && response.success) {
            // If data is null, undefined, or has no items, return empty cart
            const cart = response.data;
            if (
              !cart ||
              !cart.items ||
              cart.items.length === 0 ||
              cart.totalItems === 0
            ) {
              return this.getEmptyCart();
            }
            return cart;
          }
          throw new Error(response?.message || 'Failed to add item to cart');
        }),
        tap((cart) => {
          this.cartSubject.next(cart);
          this.cartItemCountSubject.next(cart.totalItems);
        })
      );
  }

  updateCartItem(productId: number, quantity: number): Observable<Cart> {
    const request: UpdateCartItemRequest = { productId, quantity };

    return this.http
      .put<ApiResponse<Cart>>(`${this.apiUrl}/items/${productId}`, request)
      .pipe(
        map((response) => {
          if (response && response.success) {
            // If data is null, undefined, or has no items, return empty cart
            const cart = response.data;
            if (
              !cart ||
              !cart.items ||
              cart.items.length === 0 ||
              cart.totalItems === 0
            ) {
              return this.getEmptyCart();
            }
            return cart;
          }
          throw new Error(response?.message || 'Failed to update cart item');
        }),
        tap((cart) => {
          this.cartSubject.next(cart);
          this.cartItemCountSubject.next(cart.totalItems);
        })
      );
  }

  incrementItem(productId: number): Observable<Cart> {
    return this.http
      .post<ApiResponse<any>>(`${this.apiUrl}/items/${productId}/increment`, {})
      .pipe(
        switchMap((response) => {
          if (response && response.success) {
            // After increment, reload cart to get updated state
            return this.getCart();
          }
          throw new Error(response?.message || 'Failed to increment item');
        })
      );
  }

  decrementItem(productId: number): Observable<Cart> {
    return this.http
      .post<ApiResponse<any>>(`${this.apiUrl}/items/${productId}/decrement`, {})
      .pipe(
        switchMap((response) => {
          if (response && response.success) {
            // After decrement, reload cart to get updated state
            return this.getCart();
          }
          throw new Error(response?.message || 'Failed to decrement item');
        })
      );
  }

  removeItem(productId: number): Observable<Cart> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.apiUrl}/items/${productId}`)
      .pipe(
        switchMap((response) => {
          if (response && response.success) {
            // After deletion, reload the cart to get updated state
            return this.getCart();
          }
          throw new Error(
            response?.message || 'Failed to remove item from cart'
          );
        })
      );
  }

  clearCart(): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(this.apiUrl).pipe(
      map((response) => {
        if (response && response.success) {
          const emptyCart = this.getEmptyCart();
          this.cartSubject.next(emptyCart);
          this.cartItemCountSubject.next(0);
          return true;
        }
        throw new Error(response?.message || 'Failed to clear cart');
      })
    );
  }

  private getEmptyCart(): Cart {
    return {
      items: [],
      subtotal: 0,
      discountTotal: 0,
      grandTotal: 0,
      totalItems: 0,
    };
  }
}
