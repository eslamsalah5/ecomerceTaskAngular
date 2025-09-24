import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ProductFormComponent } from './product-form.component';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockProduct: Product = {
    id: 1,
    category: 'Electronics',
    productCode: 'P01',
    name: 'Test Product',
    imageUrl: 'http://example.com/image.jpg',
    price: 100,
    minimumQuantity: 1,
    discountRate: 10,
  };

  beforeEach(async () => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', [
      'getProductById',
      'createProduct',
      'updateProduct',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    mockActivatedRoute = {
      params: of({ id: '1' }),
      snapshot: { params: { id: '1' } },
    };

    await TestBed.configureTestingModule({
      imports: [ProductFormComponent, FormsModule],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    mockProductService = TestBed.inject(
      ProductService
    ) as jasmine.SpyObj<ProductService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    mockProductService.getProductById.and.returnValue(of(mockProduct));
    mockProductService.createProduct.and.returnValue(of(mockProduct));
    mockProductService.updateProduct.and.returnValue(of(mockProduct));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize with empty form data for new product', () => {
      mockActivatedRoute.params = of({});
      component.ngOnInit();

      expect(component.isEditMode).toBeFalse();
      expect(component.formData.name).toBe('');
      expect(component.formData.category).toBe('');
      expect(component.formData.productCode).toBe('');
    });

    it('should load product data in edit mode', () => {
      component.ngOnInit();

      expect(component.isEditMode).toBeTrue();
      expect(component.productId).toBe(1);
      expect(mockProductService.getProductById).toHaveBeenCalledWith(1);
    });

    it('should populate form with product data when loading existing product', () => {
      component.ngOnInit();

      expect(component.formData.name).toBe('Test Product');
      expect(component.formData.category).toBe('Electronics');
      expect(component.formData.productCode).toBe('P01');
      expect(component.formData.price).toBe('100');
      expect(component.formData.minimumQuantity).toBe('1');
      expect(component.formData.discountRate).toBe('10');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.formData = {
        category: 'Electronics',
        productCode: 'P01',
        name: 'Test Product',
        price: '100',
        minimumQuantity: '1',
        discountRate: '10',
      };
    });

    it('should validate successfully with valid data', () => {
      expect(component.validateForm()).toBeTrue();
      expect(component.errorMessage).toBe('');
    });

    it('should fail validation when name is empty', () => {
      component.formData.name = '';
      expect(component.validateForm()).toBeFalse();
      expect(component.errorMessage).toBe('Product name is required');
    });

    it('should fail validation when name is too short', () => {
      component.formData.name = 'A';
      expect(component.validateForm()).toBeFalse();
      expect(component.errorMessage).toBe(
        'Product name must be at least 2 characters long'
      );
    });

    it('should fail validation when name is too long', () => {
      component.formData.name = 'A'.repeat(101);
      expect(component.validateForm()).toBeFalse();
      expect(component.errorMessage).toBe(
        'Product name must not exceed 100 characters'
      );
    });

    it('should fail validation when category is empty', () => {
      component.formData.category = '';
      expect(component.validateForm()).toBeFalse();
      expect(component.errorMessage).toBe('Category is required');
    });

    it('should fail validation with invalid product code format', () => {
      component.formData.productCode = 'INVALID';
      expect(component.validateForm()).toBeFalse();
      expect(component.errorMessage).toBe(
        'Product code must be in format P01, P02, etc.'
      );
    });

    it('should fail validation with invalid price', () => {
      component.formData.price = '0';
      expect(component.validateForm()).toBeFalse();
      expect(component.errorMessage).toBe(
        'Price must be a valid number greater than 0'
      );
    });

    it('should fail validation with price too high', () => {
      component.formData.price = '1000000';
      expect(component.validateForm()).toBeFalse();
      expect(component.errorMessage).toBe('Price must not exceed 999,999');
    });

    it('should fail validation with invalid minimum quantity', () => {
      component.formData.minimumQuantity = '0';
      expect(component.validateForm()).toBeFalse();
      expect(component.errorMessage).toBe(
        'Minimum quantity must be at least 1'
      );
    });

    it('should fail validation with minimum quantity too high', () => {
      component.formData.minimumQuantity = '1001';
      expect(component.validateForm()).toBeFalse();
      expect(component.errorMessage).toBe(
        'Minimum quantity must not exceed 1,000'
      );
    });

    it('should fail validation with invalid discount rate', () => {
      component.formData.discountRate = '101';
      expect(component.validateForm()).toBeFalse();
      expect(component.errorMessage).toBe(
        'Discount rate must be an integer between 0 and 100'
      );
    });
  });

  describe('Image Handling', () => {
    it('should validate image file type correctly', () => {
      const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(component.isValidImageFile(validFile)).toBeTrue();
      expect(component.imageError).toBe('');
    });

    it('should reject invalid image file type', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
      expect(component.isValidImageFile(invalidFile)).toBeFalse();
      expect(component.imageError).toBe(
        'Please select a valid image file (JPEG, PNG, GIF, WebP)'
      );
    });

    it('should reject image file that is too large', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });
      expect(component.isValidImageFile(largeFile)).toBeFalse();
      expect(component.imageError).toBe(
        'Image file size must be less than 5MB'
      );
    });

    it('should handle image selection correctly', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockFileReader = {
        onload: null as any,
        readAsDataURL: jasmine
          .createSpy('readAsDataURL')
          .and.callFake(function (this: any) {
            this.onload({ target: { result: 'data:image/jpeg;base64,test' } });
          }),
      };

      spyOn(window, 'FileReader').and.returnValue(mockFileReader as any);

      const mockEvent = {
        target: {
          files: [mockFile],
        },
      } as any;

      component.onImageSelected(mockEvent);

      expect(component.selectedImageFile).toBe(mockFile);
      expect(component.imageError).toBe('');
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
    });

    it('should clear image selection when removing image', () => {
      component.selectedImageFile = new File([''], 'test.jpg', {
        type: 'image/jpeg',
      });
      component.imagePreviewUrl = 'data:image/jpeg;base64,test';

      spyOn(document, 'getElementById').and.returnValue({
        value: 'test.jpg',
      } as any);

      component.removeImage();

      expect(component.selectedImageFile).toBeNull();
      expect(component.imagePreviewUrl).toBeNull();
      expect(component.imageError).toBe('');
    });
  });

  describe('Product Code Generation', () => {
    it('should generate product code in correct format', () => {
      component.generateProductCode();
      expect(component.formData.productCode).toMatch(/^P\d{2,}$/);
    });

    it('should auto-generate product code when category changes and code is empty', () => {
      component.formData.productCode = '';
      component.onCategoryChange();
      expect(component.formData.productCode).toMatch(/^P\d{2,}$/);
    });

    it('should not auto-generate product code when code already exists', () => {
      component.formData.productCode = 'P99';
      component.onCategoryChange();
      expect(component.formData.productCode).toBe('P99');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.formData = {
        category: 'Electronics',
        productCode: 'P01',
        name: 'Test Product',
        price: '100',
        minimumQuantity: '1',
        discountRate: '10',
      };
      component.productForm = {
        form: { markAllAsTouched: jasmine.createSpy() },
      } as any;
    });

    it('should create new product when not in edit mode', () => {
      component.isEditMode = false;
      component.onSubmit();

      expect(mockProductService.createProduct).toHaveBeenCalled();
      expect(component.successMessage).toBe('Product created successfully!');
    });

    it('should update product when in edit mode', () => {
      component.isEditMode = true;
      component.productId = 1;
      component.onSubmit();

      expect(mockProductService.updateProduct).toHaveBeenCalledWith(
        1,
        jasmine.any(FormData)
      );
      expect(component.successMessage).toBe('Product updated successfully!');
    });

    it('should not submit when validation fails', () => {
      component.formData.name = '';
      component.onSubmit();

      expect(mockProductService.createProduct).not.toHaveBeenCalled();
      expect(mockProductService.updateProduct).not.toHaveBeenCalled();
      expect(component.errorMessage).toBe(
        'Please fix the errors below before submitting'
      );
    });

    it('should handle create error correctly', () => {
      component.isEditMode = false;
      mockProductService.createProduct.and.returnValue(
        throwError({ message: 'Create failed' })
      );

      component.onSubmit();

      expect(component.errorMessage).toBe('Create failed');
      expect(component.isSaving).toBeFalse();
    });

    it('should handle update error correctly', () => {
      component.isEditMode = true;
      component.productId = 1;
      mockProductService.updateProduct.and.returnValue(
        throwError({ message: 'Update failed' })
      );

      component.onSubmit();

      expect(component.errorMessage).toBe('Update failed');
      expect(component.isSaving).toBeFalse();
    });

    it('should navigate to products list after successful submission', () => {
      jasmine.clock().install();

      component.onSubmit();
      jasmine.clock().tick(1500);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/products']);

      jasmine.clock().uninstall();
    });
  });

  describe('FormData Building', () => {
    beforeEach(() => {
      component.formData = {
        category: 'Electronics',
        productCode: 'p01',
        name: 'Test Product',
        price: '100.50',
        minimumQuantity: '5',
        discountRate: '15',
      };
    });

    it('should build FormData correctly', () => {
      const formData = component['buildFormData']();

      expect(formData.get('Category')).toBe('Electronics');
      expect(formData.get('ProductCode')).toBe('P01'); // Should be uppercase
      expect(formData.get('Name')).toBe('Test Product');
      expect(formData.get('Price')).toBe('100.5');
      expect(formData.get('MinimumQuantity')).toBe('5');
      expect(formData.get('DiscountRate')).toBe('15');
    });

    it('should include image file in FormData when selected', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.selectedImageFile = mockFile;

      const formData = component['buildFormData']();

      expect(formData.get('Image')).toBe(mockFile);
    });

    it('should not include image in FormData when no file selected', () => {
      component.selectedImageFile = null;

      const formData = component['buildFormData']();

      expect(formData.get('Image')).toBeNull();
    });
  });

  describe('Error Message Parsing', () => {
    it('should parse validation errors correctly', () => {
      const error = {
        error: {
          errors: {
            Name: ['Name is required'],
            Price: ['Price must be greater than 0'],
          },
        },
      };

      const message = component.parseErrorMessage(error);
      expect(message).toBe('Name is required, Price must be greater than 0');
    });

    it('should parse single error message', () => {
      const error = {
        error: {
          message: 'Single error message',
        },
      };

      const message = component.parseErrorMessage(error);
      expect(message).toBe('Single error message');
    });

    it('should parse title error', () => {
      const error = {
        error: {
          title: 'Title error',
        },
      };

      const message = component.parseErrorMessage(error);
      expect(message).toBe('Title error');
    });

    it('should return generic message for unknown error format', () => {
      const error = { message: 'Unknown error' };

      const message = component.parseErrorMessage(error);
      expect(message).toBe('Unknown error');
    });

    it('should return default message when no error info available', () => {
      const error = {};

      const message = component.parseErrorMessage(error);
      expect(message).toBe('An error occurred while saving the product');
    });
  });

  describe('Navigation', () => {
    it('should navigate to products list when cancelling', () => {
      component.onCancel();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/products']);
    });
  });

  describe('Component Lifecycle', () => {
    it('should unsubscribe on destroy', () => {
      spyOn(component['subscription'], 'unsubscribe');
      component.ngOnDestroy();
      expect(component['subscription'].unsubscribe).toHaveBeenCalled();
    });
  });
});
