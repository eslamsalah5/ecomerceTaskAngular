import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginData = {
    email: '',
    password: '',
  };

  rememberMe = false;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .login(this.loginData.email, this.loginData.password)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.router.navigate(['/home']);
          } else {
            this.errorMessage = response.message || 'Login failed';
          }
        },
        error: (err) => {
          this.isLoading = false;

          if (err?.title) {
            this.errorMessage = err.title;
          } else if (err?.message) {
            this.errorMessage = err.message;
          } else if (err?.errors) {
            const firstError = Object.values(err.errors)[0];
            this.errorMessage = Array.isArray(firstError)
              ? firstError[0]
              : 'Login failed';
          } else {
            this.errorMessage = 'Login failed. Please try again.';
          }

          console.error('Login error:', err);
        },
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
