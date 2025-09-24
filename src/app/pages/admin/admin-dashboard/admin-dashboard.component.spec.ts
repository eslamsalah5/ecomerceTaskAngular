import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { ProductService } from '../../../services/product.service';
import { AuthService } from '../../../services/auth.service';
import { Product } from '../../../models';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockProducts: Product[] = [
    {
      id: 1,
      category: 'Electronics',
      productCode: 'P01',
      name: 'Smartphone',
      imageUrl: 'http://example.com/phone.jpg',
      price: 500,
      minimumQuantity: 1,
      discountRate: 10,
    },
    {
      id: 2,
      category: 'Clothing',
      productCode: 'P02',
      name: 'T-Shirt',
      imageUrl: 'http://example.com/shirt.jpg',
      price: 25,
      minimumQuantity: 5,
      discountRate: 0,
    },
    {
      id: 3,
      category: 'Electronics',
      productCode: 'P03',
      name: 'Laptop',
      imageUrl: 'http://example.com/laptop.jpg',
      price: 1000,
      minimumQuantity: 1,
      discountRate: 15,
    },
    {
      id: 4,
      category: 'Books',
      productCode: 'P04',
      name: 'Programming Guide',
      imageUrl: 'http://example.com/book.jpg',
      price: 30,
      minimumQuantity: 2,
      discountRate: 5,
    },
    {
      id: 5,
      category: 'Electronics',
      productCode: 'P05',
      name: 'Tablet',
      imageUrl: 'http://example.com/tablet.jpg',
      price: 300,
      minimumQuantity: 1,
      discountRate: 8,
    },
    {
      id: 6,
      category: 'Sports',
      productCode: 'P06',
      name: 'Football',
      imageUrl: 'http://example.com/football.jpg',
      price: 20,
      minimumQuantity: 3,
      discountRate: 0,
    },
  ];

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', [
      'getAllProductsForAdmin',
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated$',
      'currentUser$',
    ]);

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent, RouterModule.forRoot([])],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    mockProductService = TestBed.inject(
      ProductService
    ) as jasmine.SpyObj<ProductService>;
    mockAuthService = TestBed.inject(
      AuthService
    ) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    mockProductService.getAllProductsForAdmin.and.returnValue(of(mockProducts));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load dashboard data on init', () => {
      component.ngOnInit();

      expect(mockProductService.getAllProductsForAdmin).toHaveBeenCalled();
      expect(component.products).toEqual(mockProducts);
      expect(component.totalProducts).toBe(6);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle error when loading dashboard data', () => {
      mockProductService.getAllProductsForAdmin.and.returnValue(
        throwError({ message: 'Failed to load' })
      );

      component.ngOnInit();

      expect(component.errorMessage).toBe('Failed to load dashboard data');
      expect(component.isLoading).toBeFalse();
    });

    it('should set recent products correctly', () => {
      component.ngOnInit();

      // Should get last 5 products in reverse order
      const expectedRecentProducts = mockProducts.slice(-5).reverse();
      expect(component.recentProducts).toEqual(expectedRecentProducts);
    });
  });

  describe('Dashboard Statistics', () => {
    beforeEach(() => {
      component.products = mockProducts;
    });

    it('should calculate products by category correctly', () => {
      const categoryCount = component.getProductsByCategory();

      expect(categoryCount['Electronics']).toBe(3);
      expect(categoryCount['Clothing']).toBe(1);
      expect(categoryCount['Books']).toBe(1);
      expect(categoryCount['Sports']).toBe(1);
    });

    it('should calculate total value correctly', () => {
      const totalValue = component.getTotalValue();
      // 500 + 25 + 1000 + 30 + 300 + 20 = 1875
      expect(totalValue).toBe(1875);
    });

    it('should calculate average price correctly', () => {
      const averagePrice = component.getAveragePrice();
      // 1875 / 6 = 312.5
      expect(averagePrice).toBe(312.5);
    });

    it('should return 0 for average price when no products', () => {
      component.products = [];
      const averagePrice = component.getAveragePrice();
      expect(averagePrice).toBe(0);
    });

    it('should count categories correctly', () => {
      const categoriesCount = component.getCategoriesCount();
      expect(categoriesCount).toBe(4);
    });

    it('should return 0 categories when no products', () => {
      component.products = [];
      const categoriesCount = component.getCategoriesCount();
      expect(categoriesCount).toBe(0);
    });
  });

  describe('Recent Products', () => {
    it('should show last 5 products in reverse order', () => {
      component.products = mockProducts;
      component.ngOnInit();

      const expectedRecent = [
        mockProducts[5],
        mockProducts[4],
        mockProducts[3],
        mockProducts[2],
        mockProducts[1],
      ];
      expect(component.recentProducts).toEqual(expectedRecent);
    });

    it('should show all products when less than 5 available', () => {
      const fewProducts = mockProducts.slice(0, 3);
      mockProductService.getAllProductsForAdmin.and.returnValue(
        of(fewProducts)
      );

      component.ngOnInit();

      const expectedRecent = [fewProducts[2], fewProducts[1], fewProducts[0]];
      expect(component.recentProducts).toEqual(expectedRecent);
    });

    it('should handle empty products array', () => {
      mockProductService.getAllProductsForAdmin.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.recentProducts).toEqual([]);
    });
  });

  describe('Image Error Handling', () => {
    it('should set placeholder image on image error', () => {
      const mockEvent = {
        target: { src: '' },
      };

      component.onImageError(mockEvent, mockProducts[0]);

      expect(mockEvent.target.src).toContain('electronics-placeholder.svg');
    });

    it('should handle different categories for placeholders', () => {
      const mockEvent = {
        target: { src: '' },
      };

      component.onImageError(mockEvent, mockProducts[1]); // Clothing category

      expect(mockEvent.target.src).toContain('clothing-placeholder.svg');
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      expect(component.isLoading).toBeTrue();
    });

    it('should hide loading state after successful load', () => {
      component.ngOnInit();
      expect(component.isLoading).toBeFalse();
    });

    it('should hide loading state after error', () => {
      mockProductService.getAllProductsForAdmin.and.returnValue(
        throwError({ message: 'Error' })
      );

      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Component Lifecycle', () => {
    it('should unsubscribe on destroy', () => {
      spyOn(component['subscription'], 'unsubscribe');
      component.ngOnDestroy();
      expect(component['subscription'].unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle products with zero price', () => {
      const productsWithZeroPrice = [
        { ...mockProducts[0], price: 0 },
        { ...mockProducts[1], price: 50 },
      ];
      component.products = productsWithZeroPrice;

      expect(component.getTotalValue()).toBe(50);
      expect(component.getAveragePrice()).toBe(25);
    });

    it('should handle products with same category', () => {
      const sameCategory = mockProducts.map((p) => ({
        ...p,
        category: 'Electronics',
      }));
      component.products = sameCategory;

      const categoryCount = component.getProductsByCategory();
      expect(categoryCount['Electronics']).toBe(6);
      expect(component.getCategoriesCount()).toBe(1);
    });

    it('should handle large numbers correctly', () => {
      const expensiveProduct = { ...mockProducts[0], price: 999999 };
      component.products = [expensiveProduct];

      expect(component.getTotalValue()).toBe(999999);
      expect(component.getAveragePrice()).toBe(999999);
    });

    it('should handle decimal prices correctly', () => {
      const decimalPriceProducts = [
        { ...mockProducts[0], price: 99.99 },
        { ...mockProducts[1], price: 49.5 },
      ];
      component.products = decimalPriceProducts;

      expect(component.getTotalValue()).toBeCloseTo(149.49, 2);
      expect(component.getAveragePrice()).toBeCloseTo(74.745, 3);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency after loading', () => {
      component.ngOnInit();

      expect(component.products.length).toBe(component.totalProducts);
      expect(component.recentProducts.length).toBeLessThanOrEqual(5);
      expect(component.recentProducts.length).toBeLessThanOrEqual(
        component.totalProducts
      );
    });

    it('should update all related data when products change', () => {
      // Initial load
      component.ngOnInit();
      const initialTotal = component.totalProducts;
      const initialRecent = component.recentProducts;

      // Simulate new data
      const newProducts = mockProducts.slice(0, 2);
      mockProductService.getAllProductsForAdmin.and.returnValue(
        of(newProducts)
      );

      // Reload data
      component.loadDashboardData();

      expect(component.totalProducts).not.toBe(initialTotal);
      expect(component.recentProducts).not.toEqual(initialRecent);
      expect(component.totalProducts).toBe(2);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProducts[0],
        id: i + 1,
        name: `Product ${i + 1}`,
        price: Math.random() * 1000,
      }));

      // Mock the service to return large dataset
      mockProductService.getAllProductsForAdmin.and.returnValue(
        of(largeDataset)
      );

      component.loadDashboardData();

      // These operations should complete without issues
      expect(() => {
        component.getProductsByCategory();
        component.getTotalValue();
        component.getAveragePrice();
        component.getCategoriesCount();
      }).not.toThrow();

      expect(component.recentProducts.length).toBe(5);
      expect(component.totalProducts).toBe(1000);
    });
  });
});
