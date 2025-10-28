import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductsComponent } from './products.component';
import { ProductService } from '../../services/product.service';
import { of, throwError } from 'rxjs';
import { Product } from '../../models';
import { FormsModule } from '@angular/forms';

const mockProducts: Product[] = [
  {
    id: 1,
    category: 'Electronics',
    productCode: 'P01',
    name: 'Laptop',
    imageUrl: '',
    price: 1000,
    minimumQuantity: 1,
    discountRate: 10,
  },
  {
    id: 2,
    category: 'Clothing',
    productCode: 'P02',
    name: 'T-Shirt',
    imageUrl: '',
    price: 50,
    minimumQuantity: 2,
    discountRate: 0,
  },
];

const mockCategories = ['Electronics', 'Clothing'];

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let fixture: ComponentFixture<ProductsComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;

  const mockPaginatedResponse = {
    data: mockProducts,
    currentPage: 1,
    totalPages: 1,
    pageSize: 12,
    totalCount: mockProducts.length,
    hasPrevious: false,
    hasNext: false,
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ProductService', [
      'getProductsWithPagination',
    ]);
    await TestBed.configureTestingModule({
      imports: [ProductsComponent, FormsModule],
      providers: [{ provide: ProductService, useValue: spy }],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductsComponent);
    component = fixture.componentInstance;
    productServiceSpy = TestBed.inject(
      ProductService
    ) as jasmine.SpyObj<ProductService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    productServiceSpy.getProductsWithPagination.and.returnValue(
      of(mockPaginatedResponse)
    );
    component.ngOnInit();
    expect(productServiceSpy.getProductsWithPagination).toHaveBeenCalled();
    expect(component.products).toEqual(mockProducts);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading products', () => {
    productServiceSpy.getProductsWithPagination.and.returnValue(
      throwError(() => new Error('fail'))
    );
    component.ngOnInit();
    expect(component.error).toContain('Failed to load products');
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading products', () => {
    productServiceSpy.getProductsWithPagination.and.returnValue(
      throwError(() => new Error('fail'))
    );
    component.ngOnInit();
    expect(component.error).toContain('Failed to load products');
    expect(component.loading).toBeFalse();
  });

  it('should calculate discounted price', () => {
    const discounted = component.getDiscountedPrice(mockProducts[0]);
    expect(discounted).toBe(900);
    const noDiscount = component.getDiscountedPrice(mockProducts[1]);
    expect(noDiscount).toBe(50);
  });

  it('should call addToCart and show alert', () => {
    spyOn(window, 'alert');
    component.addToCart(mockProducts[0]);
    expect(window.alert).toHaveBeenCalledWith('Added Laptop to cart!');
  });

  it('should call toggleWishlist and show alert', () => {
    spyOn(window, 'alert');
    component.toggleWishlist(mockProducts[1]);
    expect(window.alert).toHaveBeenCalledWith('Added T-Shirt to wishlist!');
  });

  it('should handle image error', () => {
    const event = { target: { src: '' } };
    component.onImageError(event, mockProducts[0]);
    expect(event.target.src).toContain('placeholder');
  });

  it('should unsubscribe on destroy', () => {
    const unsubSpy = spyOn(component['subscriptions'], 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalled();
  });
});
