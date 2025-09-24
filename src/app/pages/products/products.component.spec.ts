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

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ProductService', [
      'getAllProducts',
      'getCategories',
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

  it('should load products and categories on init', () => {
    productServiceSpy.getAllProducts.and.returnValue(of(mockProducts));
    productServiceSpy.getCategories.and.returnValue(of(mockCategories));
    component.ngOnInit();
    expect(productServiceSpy.getAllProducts).toHaveBeenCalled();
    expect(productServiceSpy.getCategories).toHaveBeenCalled();
    expect(component.allProducts).toEqual(mockProducts);
    expect(component.filteredProducts).toEqual(mockProducts);
    expect(component.categories).toEqual(mockCategories);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading products', () => {
    productServiceSpy.getAllProducts.and.returnValue(
      throwError(() => new Error('fail'))
    );
    productServiceSpy.getCategories.and.returnValue(of([]));
    component.ngOnInit();
    expect(component.error).toContain('Failed to load products');
    expect(component.loading).toBeFalse();
  });

  it('should filter products by category', () => {
    component.allProducts = mockProducts;
    component.selectedCategory = 'Clothing';
    component.filterProducts();
    expect(component.filteredProducts).toEqual([mockProducts[1]]);
  });

  it('should show all products when no category selected', () => {
    component.allProducts = mockProducts;
    component.selectedCategory = '';
    component.filterProducts();
    expect(component.filteredProducts).toEqual(mockProducts);
  });

  it('should clear filters', () => {
    component.allProducts = mockProducts;
    component.selectedCategory = 'Electronics';
    component.filterProducts();
    component.clearFilters();
    expect(component.selectedCategory).toBe('');
    expect(component.filteredProducts).toEqual(mockProducts);
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
