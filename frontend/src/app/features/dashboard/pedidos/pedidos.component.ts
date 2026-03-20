import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { OrdersService } from '../../../core/services/orders.service';
import { CustomersService } from '../../../core/services/customers.service';
import { PizzasService } from '../../../core/services/pizzas.service';
import {
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  CreateOrderItemDto,
} from '../../../core/models/order.model';
import { Customer } from '../../../core/models/customer.model';
import { Pizza } from '../../../core/models/pizza.model';
import { forkJoin } from 'rxjs';

interface CartItem {
  pizza: Pizza;
  quantity: number;
}

@Component({
  selector: 'app-pedidos',
  imports: [ReactiveFormsModule],
  templateUrl: './pedidos.component.html',
})
export class PedidosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  private readonly customersService = inject(CustomersService);
  private readonly pizzasService = inject(PizzasService);

  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  orders = signal<Order[]>([]);
  customers = signal<Customer[]>([]);
  pizzas = signal<Pizza[]>([]);
  statusFilter = signal<OrderStatus | 'ALL'>('ALL');
  showCreateModal = signal(false);

  // Cart state for new order
  cart = signal<CartItem[]>([]);
  selectedCustomerId = signal<number | null>(null);
  selectedPizzaId = signal<number | null>(null);
  selectedQuantity = signal(1);

  statusOptions: Array<{ value: OrderStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'PREPARING', label: 'Preparando' },
    { value: 'DELIVERED', label: 'Entregue' },
    { value: 'CANCELED', label: 'Cancelado' },
  ];

  allStatuses: OrderStatus[] = ['PENDING', 'PREPARING', 'DELIVERED', 'CANCELED'];

  filteredOrders = computed(() => {
    const filter = this.statusFilter();
    if (filter === 'ALL') return this.orders();
    return this.orders().filter((o) => o.status === filter);
  });

  cartTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.pizza.price * item.quantity, 0)
  );

  canConfirmOrder = computed(
    () => this.selectedCustomerId() !== null && this.cart().length > 0
  );

  ngOnInit() {
    forkJoin({
      orders: this.ordersService.getAll(),
      customers: this.customersService.getAll(),
      pizzas: this.pizzasService.getAll(),
    }).subscribe({
      next: ({ orders, customers, pizzas }) => {
        this.orders.set(orders);
        this.customers.set(customers);
        this.pizzas.set(pizzas);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] ?? status;
  }

  getStatusBadgeClass(status: OrderStatus): string {
    return ORDER_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800';
  }

  getStatusSelectClass(status: OrderStatus): string {
    const classes: Record<string, string> = {
      PENDING: 'border-yellow-300 bg-yellow-50 text-yellow-800',
      PREPARING: 'border-orange-300 bg-orange-50 text-orange-800',
      DELIVERED: 'border-green-300 bg-green-50 text-green-800',
      CANCELED: 'border-red-300 bg-red-50 text-red-800',
    };
    return classes[status] ?? '';
  }

  getOrderItemsSummary(order: Order): string {
    return order.items
      .map((item) => `${item.quantity}x ${item.pizza.flavorName}`)
      .join(', ');
  }

  openCreateModal() {
    this.cart.set([]);
    this.selectedCustomerId.set(null);
    this.selectedPizzaId.set(null);
    this.selectedQuantity.set(1);
    this.showCreateModal.set(true);
  }

  addToCart() {
    const pizzaId = this.selectedPizzaId();
    const qty = this.selectedQuantity();
    if (!pizzaId || qty < 1) return;

    const pizza = this.pizzas().find((p) => p.id === pizzaId);
    if (!pizza) return;

    this.cart.update((current) => {
      const existing = current.find((item) => item.pizza.id === pizzaId);
      if (existing) {
        return current.map((item) =>
          item.pizza.id === pizzaId
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...current, { pizza, quantity: qty }];
    });

    this.selectedPizzaId.set(null);
    this.selectedQuantity.set(1);
  }

  removeFromCart(pizzaId: number) {
    this.cart.update((list) => list.filter((item) => item.pizza.id !== pizzaId));
  }

  confirmOrder() {
    const customerId = this.selectedCustomerId();
    if (!customerId || this.cart().length === 0 || this.isSaving()) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const items: CreateOrderItemDto[] = this.cart().map((item) => ({
      pizzaId: item.pizza.id,
      quantity: item.quantity,
      unitPrice: item.pizza.price,
    }));

    this.ordersService.create({ customerId, items }).subscribe({
      next: (order) => {
        this.orders.update((list) => [order, ...list]);
        this.showCreateModal.set(false);
        this.isSaving.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractError(err));
        this.isSaving.set(false);
      },
    });
  }

  updateStatus(orderId: number, newStatus: OrderStatus) {
    this.ordersService.updateStatus(orderId, newStatus).subscribe({
      next: (updated) => {
        this.orders.update((list) =>
          list.map((o) => (o.id === updated.id ? updated : o))
        );
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractError(err));
      },
    });
  }

  private extractError(err: HttpErrorResponse): string {
    const msg = err.error?.message;
    if (Array.isArray(msg)) return msg.join(' | ');
    if (typeof msg === 'string') return msg;
    if (err.status === 400) return 'Dados inválidos. Verifique os campos e tente novamente.';
    return 'Ocorreu um erro. Tente novamente.';
  }
}
