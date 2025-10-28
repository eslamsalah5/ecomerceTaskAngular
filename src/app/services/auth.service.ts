import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '../models/auth.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/Auth`;
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
        error: () => {},
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
      catchError((error) => this.handleError(error))
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
            const currentUser: User = {
              name: `${response.data.firstName} ${response.data.lastName}`,
              email: response.data.email!,
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              phoneNumber: response.data.phoneNumber,
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            this.currentUserSubject.next(currentUser);
            this.isAuthenticatedSubject.next(true);
            setTimeout(() => {
              this.refreshUserProfile();
            }, 1000);
          }
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshTokenVal = localStorage.getItem('refreshToken');
    if (!refreshTokenVal) {
      return throwError(() => ({
        success: false,
        message: 'No refresh token available',
      }));
    }

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

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.error && typeof error.error === 'object') {
      return throwError(() => error.error);
    }

    let errorMessage = 'Unknown error occurred';
    if (error.status === 401) {
      errorMessage = 'Invalid credentials';
    } else if (error.status === 500) {
      errorMessage = 'Server error occurred';
    }

    return throwError(() => ({
      success: false,
      message: errorMessage,
    }));
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
