import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/auth.models';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  registerData: RegisterRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  };

  agreeTerms = false;
  subscribeNewsletter = false;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  validationErrors: any = {};

  constructor(private authService: AuthService, private router: Router) {}

  get passwordMismatch(): boolean {
    return (
      this.registerData.password !== this.registerData.confirmPassword &&
      this.registerData.confirmPassword.length > 0
    );
  }

  onRegister(): void {
    // Reset messages
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = {};

    // Validation
    if (
      !this.registerData.firstName ||
      !this.registerData.lastName ||
      !this.registerData.email ||
      !this.registerData.password
    ) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    // Additional password validation to match backend requirements
    if (!/\d/.test(this.registerData.password)) {
      this.errorMessage = 'Password must contain at least one digit (0-9)';
      return;
    }

    if (!/[A-Z]/.test(this.registerData.password)) {
      this.errorMessage =
        'Password must contain at least one uppercase letter (A-Z)';
      return;
    }

    if (!/[a-z]/.test(this.registerData.password)) {
      this.errorMessage =
        'Password must contain at least one lowercase letter (a-z)';
      return;
    }

    if (this.passwordMismatch) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (!this.agreeTerms) {
      this.errorMessage = 'Please agree to the Terms and Conditions';
      return;
    }

    this.isLoading = true;

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Account created successfully! Redirecting...';
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Registration failed';
          this.validationErrors = response.errors || {};
        }
      },
      error: (err) => {
        this.isLoading = false;

        if (err?.title) {
          this.errorMessage = err.title;
        } else if (err?.message) {
          this.errorMessage = err.message;
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }

        this.validationErrors = err?.errors || {};
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getFieldErrors(fieldName: string): string[] {
    return this.validationErrors[fieldName] || [];
  }

  hasFieldError(fieldName: string): boolean {
    return (
      this.validationErrors[fieldName] &&
      this.validationErrors[fieldName].length > 0
    );
  }

  // Password strength indicators
  get passwordStrength() {
    const password = this.registerData.password;
    return {
      minLength: password.length >= 6,
      hasDigit: /\d/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
    };
  }

  get isPasswordValid(): boolean {
    const strength = this.passwordStrength;
    return (
      strength.minLength &&
      strength.hasDigit &&
      strength.hasUpper &&
      strength.hasLower
    );
  }
}
