// User entity
export interface User {
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roles?: string[];
  imageUrl?: string;
}

// Authentication request payloads
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

// Authentication response
export interface AuthResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    token?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    roles?: string[];
    expiresAt?: string;
    refreshToken?: string;
  };
  errors?: any;
}

// Token refresh request
export interface RefreshTokenRequest {
  refreshToken: string;
}
