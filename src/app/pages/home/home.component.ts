import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  featuredProducts = [
    {
      id: 1,
      name: 'Premium Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 199.99,
    },
    {
      id: 2,
      name: 'Smart Watch',
      description: 'Feature-rich smartwatch with health monitoring',
      price: 299.99,
    },
    {
      id: 3,
      name: 'Laptop Backpack',
      description: 'Durable and stylish backpack for professionals',
      price: 79.99,
    },
    {
      id: 4,
      name: 'Wireless Speaker',
      description: 'Portable Bluetooth speaker with amazing sound',
      price: 149.99,
    },
  ];
}
