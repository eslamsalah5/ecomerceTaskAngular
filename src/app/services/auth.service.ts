import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roles?: string[];
  imageUrl?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    token?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
    expiresAt?: string;
    refreshToken?: string;
  };
  errors?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'https://localhost:7121/api/Auth';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public isAuthenticated$: Observable<boolean> =
    this.isAuthenticatedSubject.asObservable();
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);

        this.refreshUserProfile();
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
      }
    }
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get authToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private extractUserIdFromToken(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const nameIdentifier =
        payload[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
        ];
      return nameIdentifier
        ? parseInt(nameIdentifier.replace(/-/g, '').slice(0, 8), 16)
        : 0;
    } catch {
      return 0;
    }
  }

  getUserProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      map((response) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to get user profile');
      }),
      catchError(this.handleError)
    );
  }

  refreshUserProfile(): void {
    if (this.isAuthenticated && this.authToken) {
      this.getUserProfile().subscribe({
        next: (user) => {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        },
        error: () => {
          // Silent fail - keep existing user data
        },
      });
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const loginData: LoginRequest = { email, password };

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData).pipe(
      switchMap((response) => {
        if (response.success && response.data && response.data.token) {
          const token = response.data.token;
          localStorage.setItem('authToken', token);
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          return this.getUserProfile().pipe(
            map((user) => {
              localStorage.setItem('currentUser', JSON.stringify(user));
              this.currentUserSubject.next(user);
              this.isAuthenticatedSubject.next(true);
              return response;
            })
          );
        }
        return of(response);
      }),
      catchError(this.handleErrorWithRefresh)
    );
  }

  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, registerData)
      .pipe(
        map((response) => {
          if (response.success && response.data && response.data.token) {
            localStorage.setItem('authToken', response.data.token);
            if (response.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            const userId = this.extractUserIdFromToken(response.data.token);
            const tempUser: User = {
              id: userId,
              name: `${response.data.firstName} ${response.data.lastName}`,
              email: response.data.email!,
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              phoneNumber: registerData.phoneNumber,
              roles: response.data.roles,
            };
            localStorage.setItem('currentUser', JSON.stringify(tempUser));
            this.currentUserSubject.next(tempUser);
            this.isAuthenticatedSubject.next(true);
            setTimeout(() => {
              this.refreshUserProfile();
            }, 1000);
          }
          return response;
        }),
        catchError((err) => this.handleErrorWithRefresh(err))
      );
  }

  // Refresh JWT using the stored refresh token
  refreshToken(): Observable<AuthResponse> {
    const refreshTokenVal = localStorage.getItem('refreshToken');
    if (!refreshTokenVal) {
      return throwError(() => ({
        success: false,
        message: 'No refresh token available',
      }));
    }
    // Backend expects raw string in body, not JSON object
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, refreshTokenVal, {
        headers: { 'Content-Type': 'application/json' },
      })
      .pipe(
        map((response) => {
          if (response.success && response.data && response.data.token) {
            localStorage.setItem('authToken', response.data.token!);
            if (response.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.refreshToken);
            }
          }
          return response;
        }),
        catchError((err) => this.handleError(err))
      );
  }

  // Error handler that tries to refresh token on 401 and retry original request
  private handleErrorWithRefresh(
    error: HttpErrorResponse,
    caught?: Observable<any>
  ): Observable<any> {
    if (error.status === 401 && localStorage.getItem('refreshToken')) {
      return this.refreshToken().pipe(
        switchMap((refreshRes: AuthResponse) => {
          if (
            refreshRes.success &&
            localStorage.getItem('authToken') &&
            caught
          ) {
            return caught;
          }
          this.logout();
          return throwError(() => refreshRes);
        })
      );
    }
    return this.handleError(error);
  }

  // Generic error handler for HTTP requests
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Unknown error';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 400 && error.error) {
        return throwError(() => error.error);
      } else if (error.status === 401) {
        errorMessage = 'Invalid credentials';
        this.logout();
      } else if (error.status === 500) {
        errorMessage = 'Server error occurred';
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    return throwError(() => ({
      success: false,
      message: errorMessage,
      errors: error.error?.errors || null,
    }));
  }

  // Logout user and clear all tokens
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
