import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { getPlaceholderImage } from '../../../shared/utils/image-utils';

@Component({
  selector: 'app-product-form',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css',
})
export class ProductFormComponent implements OnInit, OnDestroy {
  @ViewChild('productForm') productForm!: NgForm;
  isEditMode = false;
  productId: number | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  formData = {
    category: '',
    productCode: '',
    name: '',
    price: '',
    minimumQuantity: '1',
    discountRate: '0',
  };

  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  imageError = '';

  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  private subscription = new Subscription();

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = +params['id'];
        this.loadProduct();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadProduct(): void {
    if (!this.productId) return;

    this.isLoading = true;
    this.subscription.add(
      this.productService.getProductById(this.productId).subscribe({
        next: (product) => {
          if (product) {
            this.formData = {
              category: product.category,
              productCode: product.productCode,
              name: product.name,
              price: product.price.toString(),
              minimumQuantity: product.minimumQuantity.toString(),
              discountRate: (product.discountRate || 0).toString(),
            };
            // Set image preview if product has image or use placeholder
            this.imagePreviewUrl =
              product.imageUrl || getPlaceholderImage(product.category);
          } else {
            this.errorMessage = 'Product not found';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading product:', error);
          this.errorMessage = 'Failed to load product';
          this.isLoading = false;
        },
      })
    );
  }

  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    this.productForm?.form.markAllAsTouched();

    if (!this.validateForm()) {
      this.errorMessage = 'Please fix the errors below before submitting';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const fd = this.buildFormData();
    const request$ =
      this.isEditMode && this.productId
        ? this.productService.updateProduct(this.productId, fd)
        : this.productService.createProduct(fd);

    this.subscription.add(
      request$.subscribe({
        next: () => {
          this.successMessage = this.isEditMode
            ? 'Product updated successfully!'
            : 'Product created successfully!';
          this.isSaving = false;
          setTimeout(() => {
            this.router.navigate(['/admin/products']);
          }, 1500);
        },
        error: (error) => {
          console.error('Error saving product:', error);
          this.errorMessage = this.parseErrorMessage(error);
          this.isSaving = false;
        },
      })
    );
  }

  private buildFormData(): FormData {
    const fd = new FormData();
    const category = this.formData.category.trim();
    const code = this.formData.productCode.trim().toUpperCase();
    const name = this.formData.name.trim();
    const price = parseFloat(this.formData.price);
    const minQty = parseInt(this.formData.minimumQuantity, 10);
    const discount = parseInt(this.formData.discountRate, 10);

    fd.append('Category', category);
    fd.append('ProductCode', code);
    fd.append('Name', name);
    fd.append('Price', price.toString());
    fd.append('MinimumQuantity', minQty.toString());
    fd.append('DiscountRate', discount.toString());

    if (this.selectedImageFile) {
      fd.append('Image', this.selectedImageFile);
    }

    return fd;
  }

  parseErrorMessage(error: any): string {
    if (error.error) {
      if (error.error.errors && typeof error.error.errors === 'object') {
        const errorMessages: string[] = [];
        for (const field in error.error.errors) {
          if (
            error.error.errors[field] &&
            Array.isArray(error.error.errors[field])
          ) {
            errorMessages.push(...error.error.errors[field]);
          }
        }
        return errorMessages.length > 0
          ? errorMessages.join(', ')
          : 'Validation failed';
      }

      if (error.error.message) {
        return error.error.message;
      }

      if (error.error.title) {
        return error.error.title;
      }
    }

    // Fallback to generic message
    return error.message || 'An error occurred while saving the product';
  }

  validateForm(): boolean {
    this.errorMessage = '';

    if (!this.formData.name?.trim()) {
      this.errorMessage = 'Product name is required';
      return false;
    }

    if (this.formData.name.trim().length < 2) {
      this.errorMessage = 'Product name must be at least 2 characters long';
      return false;
    }

    if (this.formData.name.trim().length > 100) {
      this.errorMessage = 'Product name must not exceed 100 characters';
      return false;
    }

    if (!this.formData.category?.trim()) {
      this.errorMessage = 'Category is required';
      return false;
    }

    if (!this.formData.productCode?.trim()) {
      this.errorMessage = 'Product code is required';
      return false;
    }

    const productCodePattern = /^P\d{2,}$/;
    if (!productCodePattern.test(this.formData.productCode.trim())) {
      this.errorMessage = 'Product code must be in format P01, P02, etc.';
      return false;
    }

    const price = parseFloat(this.formData.price);
    if (isNaN(price) || price <= 0) {
      this.errorMessage = 'Price must be a valid number greater than 0';
      return false;
    }

    if (price > 999999) {
      this.errorMessage = 'Price must not exceed 999,999';
      return false;
    }

    const minQty = Number(this.formData.minimumQuantity);
    if (!Number.isInteger(minQty) || minQty < 1) {
      this.errorMessage = 'Minimum quantity must be at least 1';
      return false;
    }

    if (minQty > 1000) {
      this.errorMessage = 'Minimum quantity must not exceed 1,000';
      return false;
    }

    const discount = Number(this.formData.discountRate);
    if (!Number.isInteger(discount) || discount < 0 || discount > 100) {
      this.errorMessage = 'Discount rate must be an integer between 0 and 100';
      return false;
    }

    if (this.selectedImageFile) {
      if (!this.isValidImageFile(this.selectedImageFile)) {
        this.errorMessage = this.imageError;
        return false;
      }
    }

    return true;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (this.isValidImageFile(file)) {
        this.selectedImageFile = file;
        this.imageError = '';

        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreviewUrl = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.selectedImageFile = null;
        this.imagePreviewUrl = null;
        input.value = '';
      }
    }
  }

  isValidImageFile(file: File): boolean {
    this.imageError = '';

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.imageError =
        'Please select a valid image file (JPEG, PNG, GIF, WebP)';
      return false;
    }

    if (file.size > this.MAX_IMAGE_SIZE) {
      this.imageError = 'Image file size must be less than 5MB';
      return false;
    }

    return true;
  }

  removeImage(): void {
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.imageError = '';

    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/products']);
  }

  generateProductCode(): void {
    // Generate product code in format P01, P02, etc.
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    const paddedNumber = randomNumber.toString().padStart(2, '0');
    this.formData.productCode = `P${paddedNumber}`;
  }

  onCategoryChange(): void {
    // Auto-generate product code when category changes (if code is empty)
    if (!this.formData.productCode.trim()) {
      this.generateProductCode();
    }
  }

  onImageError(event: any): void {
    // Handle image preview error
    const fallbackImage = getPlaceholderImage(this.formData.category);
    event.target.src = fallbackImage;
    this.imagePreviewUrl = fallbackImage;
  }
}
