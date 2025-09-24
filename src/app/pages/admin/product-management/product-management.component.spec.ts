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

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', [
      'getAllProductsForAdmin',
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
    mockProductService.getAllProductsForAdmin.and.returnValue(of(mockProducts));
    mockProductService.deleteProduct.and.returnValue(of(true));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load products on init', () => {
      component.ngOnInit();

      expect(mockProductService.getAllProductsForAdmin).toHaveBeenCalled();
      expect(component.products).toEqual(mockProducts);
      expect(component.totalItems).toBe(3);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle error when loading products', () => {
      mockProductService.getAllProductsForAdmin.and.returnValue(
        throwError({ message: 'Failed to load' })
      );

      component.ngOnInit();

      expect(component.errorMessage).toBe('Failed to load products');
      expect(component.isLoading).toBeFalse();
    });
  });

  // Search and filtering removed by request

  // Category helpers removed with filters

  describe('Pagination', () => {
    beforeEach(() => {
      component.products = mockProducts;
      component.totalItems = mockProducts.length;
      component.itemsPerPage = 2;
    });

    it('should calculate total pages correctly', () => {
      expect(component.getTotalPages()).toBe(2);
    });

    it('should get paginated products for first page', () => {
      component.currentPage = 1;
      const paginatedProducts = component.getPaginatedProducts();
      expect(paginatedProducts).toEqual([mockProducts[0], mockProducts[1]]);
    });

    it('should get paginated products for second page', () => {
      component.currentPage = 2;
      const paginatedProducts = component.getPaginatedProducts();
      expect(paginatedProducts).toEqual([mockProducts[2]]);
    });

    it('should navigate to valid page', () => {
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
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
      // loadProducts is no longer called on success (optimistic update)
    });

    it('should delete product when user confirms (optimistic update)', () => {
      (window.confirm as jasmine.Spy).and.returnValue(true);
      component.products = [...mockProducts];
      component.deleteProduct(mockProducts[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Smartphone"?'
      );
      expect(mockProductService.deleteProduct).toHaveBeenCalledWith(1);
      // Optimistic update removes the item locally
      expect(component.products.find((p) => p.id === 1)).toBeUndefined();
      expect(component.totalItems).toBe(2);
      expect(window.alert).toHaveBeenCalledWith(
        'Product deleted successfully!'
      );
    });

    it('should not delete product when user cancels', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);

      component.deleteProduct(mockProducts[0]);

      expect(mockProductService.deleteProduct).not.toHaveBeenCalled();
      // No further actions should be taken
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
      mockProductService.getAllProductsForAdmin.and.returnValue(
        throwError({ message: 'Error' })
      );

      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty product list', () => {
      mockProductService.getAllProductsForAdmin.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.products).toEqual([]);
      expect(component.totalItems).toBe(0);
      expect(component.getTotalPages()).toBe(0);
    });
  });
});
