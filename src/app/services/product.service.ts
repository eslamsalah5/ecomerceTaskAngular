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
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/Product`;
  private baseImageUrl = environment.apiUrl.replace('/api', '');

  constructor(private http: HttpClient) {}

  getFullImageUrl(
    imagePath: string | null | undefined,
    category?: string
  ): string {
    if (!imagePath || imagePath.trim().length === 0) {
      return getSafeImageUrl(null, category);
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    return imagePath.startsWith('/')
      ? this.baseImageUrl + imagePath
      : `${this.baseImageUrl}/${imagePath}`;
  }

  private normalizeProduct(product: Product): Product {
    return {
      ...product,
      imageUrl: this.getFullImageUrl(product.imageUrl, product.category),
    };
  }

  private normalizeProducts(products: Product[]): Product[] {
    return products.map((p) => this.normalizeProduct(p));
  }

  getProductById(id: number): Observable<Product | null> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        if (response && response.success && response.data) {
          return this.normalizeProduct(response.data);
        }
        throw new Error(response?.message || 'Product not found');
      }),
      catchError((error) => {
        console.error('Error fetching product:', error);
        throw error;
      })
    );
  }

  getProductsWithPagination(
    pageNumber: number = 1,
    pageSize: number = 10,
    sortBy?: string,
    sortOrder?: string
  ): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams()
      .set('PageNumber', pageNumber.toString())
      .set('PageSize', pageSize.toString());

    if (sortBy) {
      params = params.set('SortBy', sortBy);
    }
    if (sortOrder) {
      params = params.set('SortOrder', sortOrder);
    }

    return this.http
      .get<ApiResponse<PaginatedResponse<Product>>>(this.apiUrl, { params })
      .pipe(
        map((response) => {
          if (response && response.success && response.data) {
            return {
              ...response.data,
              data: this.normalizeProducts(response.data.data),
            };
          }
          throw new Error(response?.message || 'Failed to fetch products');
        }),
        catchError((error) => {
          console.error('Error fetching products with pagination:', error);
          throw error;
        })
      );
  }

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
}
