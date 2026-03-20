import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
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
    this.orders().reduce((sum, o) => sum + (o.finalValue ?? 0), 0)
  );
  recentOrders = computed(() => this.orders().slice(0, 5));

  barMaxValue = computed(() => {
    const max = Math.max(...this.topSellers().map((t) => t.totalSold), 1);
    return max;
  });

  ngOnInit() {
    forkJoin({
      customers: this.customersService.getAll(),
      orders: this.ordersService.getAll(),
      topSellers: this.pizzasService.getTopSellers(5),
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

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
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
      PENDING: 'bg-yellow-100 text-yellow-800',
      PREPARING: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELED: 'bg-red-100 text-red-800',
    };
    return classes[status] ?? 'bg-gray-100 text-gray-800';
  }

  getBarHeight(value: number): number {
    const max = this.barMaxValue();
    return max > 0 ? Math.round((value / max) * 160) : 0;
  }
}
