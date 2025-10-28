// Product entity - matches backend model
export interface Product {
  id: number;
  category: string;
  productCode: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  stock: number;
  discountPercentage: number | null;
  finalPrice: number;
}

// Product search and filter parameters
export interface ProductSearchParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
}

// Product creation request
export interface ProductCreateRequest {
  category: string;
  productCode: string;
  name: string;
  imageUrl?: string;
  price: number;
  stock: number;
  discountPercentage: number;
}

// Product update request
export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  id: number;
}

// Product category
export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  isActive: boolean;
}

// Product filter options for UI
export interface ProductFilters {
  categories: string[];
  priceRanges: PriceRange[];
  sortOptions: SortOption[];
}

export interface PriceRange {
  label: string;
  min: number;
  max: number;
}

export interface SortOption {
  label: string;
  value: string;
  direction: 'asc' | 'desc';
}
