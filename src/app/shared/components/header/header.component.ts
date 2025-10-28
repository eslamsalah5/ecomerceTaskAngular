import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { User } from '../../../models/auth.models';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentUser: User | null = null;
  cartItemCount = 0;
  private authSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication status
    this.authSubscription.add(
      this.authService.isAuthenticated$.subscribe((isAuth) => {
        this.isAuthenticated = isAuth;
      })
    );

    // Subscribe to current user
    this.authSubscription.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
      })
    );

    // Subscribe to cart item count
    this.authSubscription.add(
      this.cartService.cartItemCount$.subscribe((count) => {
        this.cartItemCount = count;
      })
    );
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  // First letter avatar for current user
  get userInitial(): string {
    const name = this.currentUser?.firstName?.trim();
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : 'U';
  }

  get userImageUrl(): string | null {
    return this.currentUser?.imageUrl || null;
  }

  get hasUserImage(): boolean {
    return !!(
      this.currentUser?.imageUrl && this.currentUser.imageUrl.trim().length > 0
    );
  }

  onImageError(): void {
    if (this.currentUser) {
      this.currentUser.imageUrl = undefined;
    }
  }

  get userDisplayName(): string {
    if (!this.currentUser) return 'User';

    // Show first name if available, otherwise fall back to full name or email
    if (this.currentUser.firstName) {
      return this.currentUser.firstName;
    }

    if (this.currentUser.name) {
      return this.currentUser.name;
    }

    // Extract name from email as last resort
    const emailName = this.currentUser.email?.split('@')[0];
    return emailName || 'User';
  }

  get userRole(): string {
    if (!this.currentUser?.roles || this.currentUser.roles.length === 0) {
      return 'User';
    }
    return this.currentUser.roles[0]; // Display primary role
  }

  get isCustomer(): boolean {
    return this.currentUser?.roles?.includes('Customer') || false;
  }

  get isAdmin(): boolean {
    return this.currentUser?.roles?.includes('Admin') || false;
  }
}
