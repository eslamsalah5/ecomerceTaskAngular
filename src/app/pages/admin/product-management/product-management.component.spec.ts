import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ProductManagementComponent } from './product-management.component';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models';

describe('ProductManagementComponent', () => {
  let component: ProductManagementComponent;
  let fixture: ComponentFixture<ProductManagementComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockRouter: jasmine.SpyObj<Router>;

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
  ];

  const mockPaginatedResponse = {
    data: mockProducts,
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: mockProducts.length,
    hasPrevious: false,
    hasNext: false,
  };

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', [
      'getProductsWithPagination',
      'deleteProduct',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProductManagementComponent, FormsModule],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductManagementComponent);
    component = fixture.componentInstance;
    mockProductService = TestBed.inject(
      ProductService
    ) as jasmine.SpyObj<ProductService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    mockProductService.getProductsWithPagination.and.returnValue(
      of(mockPaginatedResponse)
    );
    mockProductService.deleteProduct.and.returnValue(of(true));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load products on init', () => {
      component.ngOnInit();

      expect(mockProductService.getProductsWithPagination).toHaveBeenCalled();
      expect(component.products).toEqual(mockProducts);
      expect(component.totalCount).toBe(3);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle error when loading products', () => {
      mockProductService.getProductsWithPagination.and.returnValue(
        throwError({ message: 'Failed to load' })
      );

      component.ngOnInit();

      expect(component.errorMessage).toBe('Failed to load products');
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Pagination', () => {
    it('should navigate to valid page', () => {
      const page2Response = {
        ...mockPaginatedResponse,
        currentPage: 2,
      };
      mockProductService.getProductsWithPagination.and.returnValue(
        of(page2Response)
      );
      component.goToPage(2);
      expect(mockProductService.getProductsWithPagination).toHaveBeenCalled();
    });

    it('should not navigate to invalid page (too low)', () => {
      component.currentPage = 1;
      component.goToPage(0);
      expect(component.currentPage).toBe(1);
    });

    it('should not navigate to invalid page (too high)', () => {
      component.currentPage = 1;
      component.goToPage(5);
      expect(component.currentPage).toBe(1);
    });
  });

  describe('Product Actions', () => {
    it('should navigate to edit product', () => {
      component.editProduct(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/admin/products/edit',
        1,
      ]);
    });

    it('should navigate to view product', () => {
      component.viewProduct(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/product', 1]);
    });

    it('should navigate to add new product', () => {
      component.addNewProduct();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/products/new']);
    });
  });

  describe('Product Deletion', () => {
    beforeEach(() => {
      spyOn(window, 'confirm');
      spyOn(window, 'alert');
    });

    it('should delete product when user confirms and reload products', () => {
      (window.confirm as jasmine.Spy).and.returnValue(true);
      component.products = [...mockProducts];
      component.deleteProduct(mockProducts[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Smartphone"?'
      );
      expect(mockProductService.deleteProduct).toHaveBeenCalledWith(1);
      expect(window.alert).toHaveBeenCalledWith(
        'Product deleted successfully!'
      );
      expect(mockProductService.getProductsWithPagination).toHaveBeenCalled();
    });

    it('should not delete product when user cancels', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);

      component.deleteProduct(mockProducts[0]);

      expect(mockProductService.deleteProduct).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      (window.confirm as jasmine.Spy).and.returnValue(true);
      mockProductService.deleteProduct.and.returnValue(
        throwError({ message: 'Delete failed' })
      );

      component.deleteProduct(mockProducts[0]);

      expect(window.alert).toHaveBeenCalledWith(
        'Failed to delete product. Please try again.'
      );
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
  });

  describe('TrackBy Function', () => {
    it('should return product id for tracking', () => {
      const result = component.trackByProductId(0, mockProducts[0]);
      expect(result).toBe(1);
    });
  });

  describe('Component Lifecycle', () => {
    it('should unsubscribe on destroy', () => {
      spyOn(component['subscription'], 'unsubscribe');
      component.ngOnDestroy();
      expect(component['subscription'].unsubscribe).toHaveBeenCalled();
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
      mockProductService.getProductsWithPagination.and.returnValue(
        throwError({ message: 'Error' })
      );

      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty product list', () => {
      const emptyResponse = {
        ...mockPaginatedResponse,
        data: [],
        totalCount: 0,
        totalPages: 0,
      };
      mockProductService.getProductsWithPagination.and.returnValue(
        of(emptyResponse)
      );

      component.ngOnInit();

      expect(component.products).toEqual([]);
      expect(component.totalCount).toBe(0);
      expect(component.totalPages).toBe(0);
    });
  });
});
