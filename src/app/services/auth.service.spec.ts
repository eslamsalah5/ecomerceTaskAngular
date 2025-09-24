import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

const mockAuthResponse = {
  success: true,
  data: {
    token: 'mock-token',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    roles: ['Admin'],
  },
  message: 'Login successful',
};

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  roles: ['Admin'],
  imageUrl: '',
};

describe('AuthService', () => {
  let service: AuthService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['post', 'get']);
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: HttpClient, useValue: spy }],
    });
    service = TestBed.inject(AuthService);
    httpSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'removeItem');
    // Always mock getUserProfile to avoid test failures
    httpSpy.get.and.callFake(
      (...args: any[]) => of({ success: true, data: mockUser }) as any
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login and update observables', fakeAsync(() => {
    httpSpy.post.and.returnValue(of(mockAuthResponse));
    // httpSpy.get is already mocked globally
    let loginResult: any;
    service.login('test@example.com', 'password').subscribe((res) => {
      loginResult = res;
    });
    tick();
    expect(loginResult).toEqual(mockAuthResponse);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'authToken',
      'mock-token'
    );
    let isAuth: boolean | undefined;
    service.isAuthenticated$.subscribe((val) => (isAuth = val));
    tick();
    expect(isAuth).toBeTrue();
    let user: any;
    service.currentUser$.subscribe((u) => (user = u));
    tick();
    expect(user?.email).toBe('test@example.com');
  }));

  it('should register and update observables', fakeAsync(() => {
    httpSpy.post.and.returnValue(of(mockAuthResponse));
    httpSpy.get.and.returnValue(of(mockUser));
    let registerResult: any;
    service
      .register({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
      })
      .subscribe((res) => {
        registerResult = res;
      });
    tick();
    expect(registerResult).toEqual(mockAuthResponse);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'authToken',
      'mock-token'
    );
    let isAuth: boolean | undefined;
    service.isAuthenticated$.subscribe((val) => (isAuth = val));
    tick();
    expect(isAuth).toBeTrue();
    let user: any;
    service.currentUser$.subscribe((u) => (user = u));
    tick();
    expect(user?.name).toBe('Test User');
  }));

  it('should handle login error', (done) => {
    httpSpy.post.and.returnValue(throwError(() => new Error('fail')));
    service.login('fail@example.com', 'password').subscribe({
      error: (err) => {
        expect(err).toBeTruthy();
        service.isAuthenticated$.subscribe((isAuth) => {
          expect(isAuth).toBeFalse();
          done();
        });
      },
    });
  });

  it('should handle register error', (done) => {
    httpSpy.post.and.returnValue(throwError(() => new Error('fail')));
    service
      .register({
        firstName: 'Fail',
        lastName: 'User',
        email: 'fail@example.com',
        password: 'password',
        confirmPassword: 'password',
      })
      .subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          service.isAuthenticated$.subscribe((isAuth) => {
            expect(isAuth).toBeFalse();
            done();
          });
        },
      });
  });

  it('should logout and clear observables/localStorage', fakeAsync(() => {
    httpSpy.post.and.returnValue(of(mockAuthResponse));
    // httpSpy.get is already mocked globally
    service.login('test@example.com', 'password').subscribe(() => {});
    tick();
    service.logout();
    expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(localStorage.removeItem).toHaveBeenCalledWith('currentUser');
    let isAuth: boolean | undefined;
    service.isAuthenticated$.subscribe((val) => (isAuth = val));
    tick();
    expect(isAuth).toBeFalse();
    let user: any;
    service.currentUser$.subscribe((u) => (user = u));
    tick();
    expect(user).toBeNull();
  }));
});
