# E-CommerceTaskAngular

This is an Angular 19 e-commerce demo project.

## Features

- JWT authentication with automatic token refresh
- User registration and login
- Product listing and details
- Protected routes and guards
- HTTP interceptor for auth
- Unit tests for services

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the app:
   ```bash
   npm start
   ```
3. Run tests:
   ```bash
   npm test
   ```

## Folder Structure

- `src/app/services/` — Business logic and API calls
- `src/app/interceptors/` — HTTP interceptors
- `src/app/pages/` — Main pages (home, login, register, etc.)
- `src/app/shared/` — Shared components, directives, pipes

## Auth Flow

- On 401 error, the app automatically refreshes the token and retries the request.
- All auth logic is handled in `AuthService`.

## License

MIT
