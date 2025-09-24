import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  ApiResponse,
  PaginatedResponse,
  Product,
  ProductSearchParams,
} from '../models';
import { getSafeImageUrl } from '../shared/utils/image-utils';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'https://localhost:7121/api/Product';
  private baseImageUrl = 'https://localhost:7121'; // Base URL for images

  constructor(private http: HttpClient) {}

  // Helper: get full image URL or a safe placeholder
  getFullImageUrl(
    imagePath: string | null | undefined,
    category?: string
  ): string {
    if (!imagePath || imagePath.trim().length === 0) {
      return getSafeImageUrl(null, category);
    }

    // If it's already a full URL (starts with http/https), return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Prepend base URL for relative paths
    return imagePath.startsWith('/')
      ? this.baseImageUrl + imagePath
      : `${this.baseImageUrl}/${imagePath}`;
  }

  // Normalizers to DRY image processing
  private normalizeProduct(product: Product): Product {
    return {
      ...product,
      imageUrl: this.getFullImageUrl(product.imageUrl, product.category),
    };
  }

  private normalizeProducts(products: Product[]): Product[] {
    return products.map((p) => this.normalizeProduct(p));
  }

  // Get all products with pagination
  getAllProducts(
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<Product[]> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    return this.http
      .get<ApiResponse<PaginatedResponse<Product>>>(`${this.apiUrl}`, {
        params,
      })
      .pipe(
        map((response) => {
          // Check if response is successful and has the expected structure
          if (
            response &&
            response.success &&
            response.data &&
            response.data.data
          ) {
            return this.normalizeProducts(response.data.data);
          }

          throw new Error(response?.message || 'Failed to fetch products');
        }),
        catchError((error) => {
          console.error('Error fetching products:', error);
          return of(this.getMockProducts());
        })
      );
  }

  // Get product by ID
  getProductById(id: number): Observable<Product | null> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        // Check if response is successful and has product data
        if (response && response.success && response.data) {
          return this.normalizeProduct(response.data);
        }

        throw new Error(response?.message || 'Product not found');
      }),
      catchError((error) => {
        console.error('Error fetching product:', error);
        // Return mock data as fallback
        const mockProducts = this.getMockProducts();
        return of(mockProducts.find((p) => p.id === id) || null);
      })
    );
  }

  // Get products with pagination metadata
  getProductsWithPagination(
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PaginatedResponse<Product>> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    return this.http
      .get<ApiResponse<PaginatedResponse<Product>>>(`${this.apiUrl}`, {
        params,
      })
      .pipe(
        map((response) => {
          if (response && response.success && response.data) {
            return response.data; // Keep pagination contract as-is
          }

          throw new Error(response?.message || 'Failed to fetch products');
        }),
        catchError((error) => {
          console.error('Error fetching products with pagination:', error);
          // Return mock paginated response
          const mockProducts = this.getMockProducts();
          return of({
            data: mockProducts,
            currentPage: 1,
            totalPages: 1,
            pageSize: mockProducts.length,
            totalCount: mockProducts.length,
            hasPrevious: false,
            hasNext: false,
          });
        })
      );
  }

  // Search products with advanced parameters
  searchProducts(searchParams: ProductSearchParams): Observable<Product[]> {
    let params = new HttpParams();

    if (searchParams.pageNumber)
      params = params.set('PageNumber', searchParams.pageNumber.toString());
    if (searchParams.pageSize)
      params = params.set('PageSize', searchParams.pageSize.toString());
    if (searchParams.category)
      params = params.set('Category', searchParams.category);
    if (searchParams.minPrice)
      params = params.set('MinPrice', searchParams.minPrice.toString());
    if (searchParams.maxPrice)
      params = params.set('MaxPrice', searchParams.maxPrice.toString());
    if (searchParams.searchTerm)
      params = params.set('SearchTerm', searchParams.searchTerm);

    return this.http
      .get<ApiResponse<PaginatedResponse<Product>>>(`${this.apiUrl}/search`, {
        params,
      })
      .pipe(
        map((response) => {
          if (
            response &&
            response.success &&
            response.data &&
            response.data.data
          ) {
            return this.normalizeProducts(response.data.data);
          }
          throw new Error(response?.message || 'Failed to search products');
        }),
        catchError((error) => {
          console.error('Error searching products:', error);
          return of(
            this.getMockProducts().filter(
              (p) =>
                !searchParams.category ||
                p.category
                  .toLowerCase()
                  .includes(searchParams.category.toLowerCase())
            )
          );
        })
      );
  }

  // Get unique categories from products
  getCategories(): Observable<string[]> {
    return this.getAllProducts().pipe(
      map((products) => {
        const categories = [...new Set(products.map((p) => p.category))];
        return categories.sort();
      })
    );
  }

  // Get products by category
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.searchProducts({ category });
  }

  // Get featured products (products with discounts)
  getFeaturedProducts(): Observable<Product[]> {
    return this.getAllProducts().pipe(
      map((products) =>
        products.filter((p) => p.discountRate && p.discountRate > 0)
      )
    );
  }

  // Mock data for fallback
  private getMockProducts(): Product[] {
    const products = [
      {
        id: 1,
        category: 'Electronics',
        productCode: 'P01',
        name: 'Gaming Laptop',
        imageUrl:
          'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400&h=300&fit=crop&auto=format',
        price: 1500,
        minimumQuantity: 1,
        discountRate: 10.5,
      },
      {
        id: 2,
        category: 'Electronics',
        productCode: 'P02',
        name: 'Smartphone',
        imageUrl:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop&auto=format',
        price: 800,
        minimumQuantity: 1,
        discountRate: 5,
      },
      {
        id: 3,
        category: 'Clothing',
        productCode: 'P03',
        name: 'Premium T-Shirt',
        imageUrl:
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop&auto=format',
        price: 49.99,
        minimumQuantity: 1,
        discountRate: 15,
      },
      {
        id: 4,
        category: 'Electronics',
        productCode: 'P04',
        name: 'Wireless Headphones',
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&auto=format',
        price: 199.99,
        minimumQuantity: 1,
        discountRate: 20,
      },
      {
        id: 5,
        category: 'Electronics',
        productCode: 'P05',
        name: 'Smart Watch',
        imageUrl:
          'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&h=300&fit=crop&auto=format',
        price: 299.99,
        minimumQuantity: 1,
        discountRate: null,
      },
      {
        id: 6,
        category: 'Home',
        productCode: 'P06',
        name: 'Coffee Maker',
        imageUrl:
          'https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=400&h=300&fit=crop&auto=format',
        price: 89.99,
        minimumQuantity: 1,
        discountRate: 10,
      },
      {
        id: 7,
        category: 'Clothes',
        productCode: 'P15',
        name: 'Short',
        imageUrl: '/uploads/products/4e453195-f91f-46c4-a1ce-e23b7c5cd6a7.jpg',
        price: 120,
        minimumQuantity: 1,
        discountRate: 10,
      },
      {
        id: 8,
        category: 'Accessories',
        productCode: 'P16',
        name: 'Leather Bag',
        imageUrl:
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop&auto=format',
        price: 85,
        minimumQuantity: 1,
        discountRate: 5,
      },
      {
        id: 9,
        category: 'Clothes',
        productCode: 'P17',
        name: 'Blue Jeans',
        imageUrl:
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop&auto=format',
        price: 75,
        minimumQuantity: 1,
        discountRate: 15,
      },
    ];

    // Normalize image URLs for mock products too
    return this.normalizeProducts(products);
  }

  // Admin CRUD Operations

  // Create new product
  createProduct(productData: FormData): Observable<Product> {
    return this.http
      .post<ApiResponse<Product>>(`${this.apiUrl}`, productData)
      .pipe(
        map((response) => {
          if (response && response.success && response.data) {
            return this.normalizeProduct(response.data);
          }
          throw new Error(response?.message || 'Failed to create product');
        }),
        catchError((error) => {
          console.error('Error creating product:', error);
          throw error;
        })
      );
  }

  // Update existing product
  updateProduct(id: number, productData: FormData): Observable<Product> {
    return this.http
      .put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, productData)
      .pipe(
        map((response) => {
          if (response && response.success && response.data) {
            return this.normalizeProduct(response.data);
          }
          throw new Error(response?.message || 'Failed to update product');
        }),
        catchError((error) => {
          console.error('Error updating product:', error);
          throw error;
        })
      );
  }

  // Delete product
  deleteProduct(id: number): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        if (response && response.success) {
          return true;
        }
        throw new Error(response?.message || 'Failed to delete product');
      }),
      catchError((error) => {
        console.error('Error deleting product:', error);
        throw error;
      })
    );
  }

  // Get all products for admin (without pagination limits)
  getAllProductsForAdmin(): Observable<Product[]> {
    const params = new HttpParams()
      .set('PageNumber', '1')
      .set('PageSize', '1000'); // Large page size to get all products

    return this.http
      .get<ApiResponse<PaginatedResponse<Product>>>(`${this.apiUrl}`, {
        params,
      })
      .pipe(
        map((response) => {
          if (
            response &&
            response.success &&
            response.data &&
            response.data.data
          ) {
            return this.normalizeProducts(response.data.data);
          }
          throw new Error(response?.message || 'Failed to fetch products');
        }),
        catchError((error) => {
          console.error('Error fetching all products for admin:', error);
          return of(this.getMockProducts());
        })
      );
  }
}
