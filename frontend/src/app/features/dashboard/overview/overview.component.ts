import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CustomersService } from '../../../core/services/customers.service';
import { OrdersService } from '../../../core/services/orders.service';
import { PizzasService } from '../../../core/services/pizzas.service';
import { Order } from '../../../core/models/order.model';
import { TopSeller } from '../../../core/models/pizza.model';
import { Customer } from '../../../core/models/customer.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-overview',
  imports: [RouterLink],
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {
  private readonly customersService = inject(CustomersService);
  private readonly ordersService = inject(OrdersService);
  private readonly pizzasService = inject(PizzasService);

  isLoading = signal(true);
  customers = signal<Customer[]>([]);
  orders = signal<Order[]>([]);
  topSellers = signal<TopSeller[]>([]);

  totalCustomers = computed(() => this.customers().length);
  totalOrders = computed(() => this.orders().length);
  totalRevenue = computed(() =>
    this.orders().reduce(
      (sum, o) => sum + this.toNumber(o.finalValue ?? 0),
      0,
    ),
  );
  recentOrders = computed(() => this.orders().slice(0, 5));

  barMaxValue = computed(() => {
    const values = this.topSellers().map((t) => this.toNumber(t.totalSold));
    return Math.max(...values, 1);
  });

  ngOnInit() {
    forkJoin({
      customers: this.customersService.getAll().pipe(catchError(() => of([]))),
      orders: this.ordersService.getAll().pipe(catchError(() => of([]))),
      topSellers: this.pizzasService.getTopSellers(5).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ customers, orders, topSellers }) => {
        this.customers.set(customers);
        this.orders.set(orders);
        this.topSellers.set(topSellers);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  toNumber(value: number | string): number {
    return typeof value === 'string' ? parseFloat(value) || 0 : value;
  }

  formatCurrency(value: number | string): string {
    const num = this.toNumber(value);
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      PREPARING: 'Preparando',
      DELIVERED: 'Entregue',
      CANCELED: 'Cancelado',
    };
    return labels[status] ?? status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      PENDING: 'status-pill status-pending',
      PREPARING: 'status-pill status-preparing',
      DELIVERED: 'status-pill status-delivered',
      CANCELED: 'status-pill status-canceled',
    };
    return classes[status] ?? 'status-pill status-pending';
  }

  getBarWidth(value: number | string): number {
    const num = this.toNumber(value);
    const max = this.barMaxValue();
    return max > 0 ? Math.round((num / max) * 100) : 0;
  }
}
