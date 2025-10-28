export interface CartItem {
  productId: number;
  productCode: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  discountPercentage: number | null;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  totalItems: number;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  productId: number;
  quantity: number;
}
