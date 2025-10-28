import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { CartComponent } from './cart.component';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../models/cart.models';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let cartService: jasmine.SpyObj<CartService>;

  const mockCart: Cart = {
    items: [
      {
        productId: 1,
        productCode: 'PROD001',
        name: 'Test Product',
        imageUrl: 'test.jpg',
        unitPrice: 100,
        discountPercentage: 10,
        quantity: 2,
        lineTotal: 180,
      },
    ],
    subtotal: 200,
    discountTotal: 20,
    grandTotal: 180,
    totalItems: 2,
  };

  beforeEach(async () => {
    const cartServiceSpy = jasmine.createSpyObj('CartService', [
      'incrementItem',
      'decrementItem',
      'removeItem',
      'clearCart',
    ]);
    cartServiceSpy.cart$ = of(mockCart);
    cartServiceSpy.cartItemCount$ = of(2);

    await TestBed.configureTestingModule({
      imports: [CartComponent, RouterTestingModule],
      providers: [{ provide: CartService, useValue: cartServiceSpy }],
    }).compileComponents();

    cartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display cart items', () => {
    component.cart = mockCart;
    fixture.detectChanges();
    expect(component.hasItems).toBe(true);
  });

  it('should increment item quantity', () => {
    cartService.incrementItem.and.returnValue(of(mockCart));
    component.incrementQuantity(mockCart.items[0]);
    expect(cartService.incrementItem).toHaveBeenCalledWith(1);
  });

  it('should decrement item quantity', () => {
    cartService.decrementItem.and.returnValue(of(mockCart));
    component.decrementQuantity(mockCart.items[0]);
    expect(cartService.decrementItem).toHaveBeenCalledWith(1);
  });

  it('should remove item from cart', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    cartService.removeItem.and.returnValue(of(mockCart));
    component.removeItem(mockCart.items[0]);
    expect(cartService.removeItem).toHaveBeenCalledWith(1);
  });

  it('should clear cart', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    cartService.clearCart.and.returnValue(of(true));
    component.clearCart();
    expect(cartService.clearCart).toHaveBeenCalled();
  });
});
