# 🛒 Angular E-Commerce Application

A modern, full-featured e-commerce application built with **Angular 19** using standalone components architecture. This project demonstrates best practices in Angular development, including JWT authentication, server-side pagination, and integration with a .NET backend API.

[![Angular](https://img.shields.io/badge/Angular-19.2.0-red)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)](https://www.typescriptlang.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-purple)](https://getbootstrap.com/)

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Integration](#-api-integration)
- [Authentication System](#-authentication-system)
- [Testing](#-testing)
- [Development Guidelines](#-development-guidelines)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### User Features

- 🔐 **JWT Authentication** - Secure login/register with token-based authentication
- 🛍️ **Product Browse** - Browse products with server-side pagination
- 🔍 **Product Details** - Detailed product information and images
- 👤 **User Profile** - Automatic profile fetching and management
- 🎨 **Responsive Design** - Bootstrap 5 integration for mobile-friendly UI

### Admin Features

- 📊 **Admin Dashboard** - Overview of store statistics
- ➕ **Product Management** - Create, edit, and delete products
- 🖼️ **Image Upload** - Product image management with normalization
- 📄 **Pagination** - Server-side paginated product lists

### Technical Features

- 🚀 **Standalone Components** - Modern Angular 19 architecture (no NgModules)
- 🔒 **Route Guards** - Functional guards for authentication and guest routes
- 🔄 **HTTP Interceptors** - Automatic token injection for API requests
- 📦 **API Response Wrapper** - Consistent response handling pattern
- 🧪 **Unit Testing** - Comprehensive test coverage with Jasmine/Karma
- 📐 **Strict TypeScript** - Full type safety with strict mode enabled

## 🏗️ Architecture

This project follows Angular 19's **standalone component architecture** with functional patterns:

### Core Patterns

- **Standalone Components**: All components use `imports` array (no `NgModule`)
- **Functional Guards**: `CanActivateFn` pattern (`authGuard`, `guestGuard`)
- **Functional Interceptors**: `HttpInterceptorFn` pattern (`authInterceptor`)
- **Reactive State Management**: RxJS `BehaviorSubject` for auth state
- **Server-Side Pagination**: All product listings use backend pagination

### API Integration

- Backend API: `https://localhost:7121`
- All responses wrapped in `ApiResponse<T>` interface
- Automatic token injection via `authInterceptor`
- Image URL normalization for product images

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Angular CLI** (v19.2.6)
- **.NET Backend API** running on `https://localhost:7121`

```bash
# Verify installations
node --version
npm --version
ng version
```

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/eslamsalah5/ecomerceTaskAngular.git
   cd E-CommerceTaskAngular
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure API endpoint** (if needed)

   Update the API base URL in service files if your backend runs on a different port.

## 🚀 Running the Application

### Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you change any source files.

### Build for Production

```bash
npm run build
# or
ng build
```

The build artifacts will be stored in the `dist/` directory.

### Watch Mode

```bash
npm run watch
# or
ng build --watch --configuration development
```

## 📁 Project Structure

```
src/app/
├── models/                      # TypeScript interfaces and types
│   ├── api.models.ts           # API response wrappers
│   ├── auth.models.ts          # Authentication models (User, LoginRequest, etc.)
│   ├── product.models.ts       # Product and pagination models
│   └── index.ts                # Barrel exports
│
├── services/                    # Business logic and API calls
│   ├── auth.service.ts         # JWT authentication, user management
│   ├── auth.service.spec.ts    # Auth service tests
│   ├── product.service.ts      # Product CRUD, pagination
│   └── product.service.spec.ts # Product service tests
│
├── guards/                      # Route protection
│   └── auth.guard.ts           # Functional guards (authGuard, guestGuard)
│
├── interceptors/                # HTTP interceptors
│   └── auth.interceptor.ts     # Token injection interceptor
│
├── pages/                       # Routable page components
│   ├── home/                   # Landing page
│   ├── about/                  # About page
│   ├── login/                  # Login page (guest-only)
│   ├── register/               # Registration page (guest-only)
│   ├── products/               # Product listing (paginated)
│   ├── product-detail/         # Single product view
│   └── admin/                  # Admin section
│       ├── admin-dashboard/    # Admin overview
│       ├── product-management/ # Product list for admin
│       └── product-form/       # Create/Edit product
│
├── shared/                      # Shared components and utilities
│   ├── components/
│   │   ├── header/             # Navigation header
│   │   ├── footer/             # Footer component
│   │   └── layout/             # Main layout wrapper
│   └── utils/
│       └── image-utils.ts      # Image URL normalization
│
├── app.component.ts             # Root component
├── app.config.ts                # Application providers configuration
└── app.routes.ts                # Route definitions
```

## 🔌 API Integration

### Response Wrapper Pattern

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}
```

Services automatically unwrap the response:

```typescript
// Example from ProductService
getProducts() {
  return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/products`)
    .pipe(map(response => response.data));
}
```

### Pagination

All product listings use server-side pagination:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
```

Usage:

```typescript
productService.getProductsWithPagination(pageNumber, pageSize);
```

### Image Normalization

Product images are automatically normalized to absolute URLs with fallback placeholders:

```typescript
// Converts relative paths to https://localhost:7121/...
// Provides category-specific placeholders for missing images
normalizeProduct(product: Product): Product
```

## 🔐 Authentication System

### Token Flow

1. **Login** → `AuthService.login()` stores token in `localStorage`
2. **Profile Fetch** → Automatically fetches user profile after login
3. **Token Injection** → `authInterceptor` adds `Authorization: Bearer {token}` to all `/api/*` requests
4. **State Management** → Updates `BehaviorSubject` observables for reactive UI

### State Observables

```typescript
// Subscribe to authentication state
authService.isAuthenticated$.subscribe((isAuth) => {
  // React to auth changes
});

// Subscribe to current user
authService.currentUser$.subscribe((user) => {
  // React to user profile changes
});
```

### Route Guards

- **`authGuard`** - Protects authenticated routes (products, admin)
- **`guestGuard`** - Protects guest-only routes (login, register)

Example usage in routes:

```typescript
{
  path: 'products',
  component: ProductsComponent,
  canActivate: [authGuard]
}
```

## 🧪 Testing

### Run Tests

```bash
npm test
# or
ng test
```

This runs unit tests via [Karma](https://karma-runner.github.io) with [Jasmine](https://jasmine.github.io/).

### Test Coverage

The project includes comprehensive tests for:

- ✅ Authentication service (`auth.service.spec.ts`)
- ✅ Product service (`product.service.spec.ts`)
- ✅ Admin components (dashboard, product management)
- ✅ Product detail component
- ✅ Products listing component

### Testing Patterns

```typescript
// Example: Mocking HttpClient
beforeEach(() => {
  const httpSpy = jasmine.createSpyObj("HttpClient", ["post", "get"]);
  httpSpy.get.and.returnValue(of({ success: true, data: mockUser }));

  spyOn(localStorage, "setItem");
  spyOn(localStorage, "getItem").and.returnValue(null);
});
```

## 💻 Development Guidelines

### Component Patterns

1. **Import CommonModule** for structural directives (`*ngIf`, `*ngFor`, `AsyncPipe`)
2. **Import FormsModule** for template-driven forms (`[(ngModel)]`)
3. **Import RouterModule** for routing (`[routerLink]`, `<router-outlet>`)
4. **Unsubscribe properly** - Store subscriptions and unsubscribe in `ngOnDestroy`

Example:

```typescript
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class ExampleComponent implements OnDestroy {
  private subscription = new Subscription();

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
```

### Service Patterns

- Use `providedIn: 'root'` for singleton services
- Return Observables for async operations
- Use RxJS operators for data transformation
- Always unwrap `ApiResponse<T>` with `.pipe(map(response => response.data))`

### Style Guidelines

- Use Bootstrap 5.3.8 utility classes
- Follow responsive design principles
- Keep component styles scoped
- Use CSS custom properties for theming

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Convention

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

**Repository**: [eslamsalah5/ecomerceTaskAngular](https://github.com/eslamsalah5/ecomerceTaskAngular)

**Issues**: Report bugs or request features via [GitHub Issues](https://github.com/eslamsalah5/ecomerceTaskAngular/issues)

---

Made with ❤️ using Angular 19
