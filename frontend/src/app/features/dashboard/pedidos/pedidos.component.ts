import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
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

  // Modal state
  showOrderModal = signal(false);
  editingOrderId = signal<number | null>(null);

  // Cart state
  cart = signal<CartItem[]>([]);
  selectedCustomerId = signal<number | null>(null);
  selectedPizzaId = signal<number | null>(null);
  selectedQuantity = signal(1);

  // Discount modal state
  showDiscountModal = signal(false);
  discountEligible = signal(false);
  discountCustomerName = signal('');
  isDiscountApplied = signal(false);

  // Delete confirmation
  deleteConfirmId = signal<number | null>(null);

  statusOptions: Array<{ value: OrderStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'PREPARING', label: 'Preparando' },
    { value: 'DELIVERED', label: 'Entregue' },
    { value: 'CANCELED', label: 'Cancelado' },
  ];

  allStatuses: OrderStatus[] = ['PENDING', 'PREPARING', 'DELIVERED', 'CANCELED'];

  isEditMode = computed(() => this.editingOrderId() !== null);

  modalTitle = computed(() =>
    this.isEditMode() ? 'Editar Pedido' : 'Novo Pedido',
  );

  filteredOrders = computed(() => {
    const filter = this.statusFilter();
    if (filter === 'ALL') return this.orders();
    return this.orders().filter((o) => o.status === filter);
  });

  cartTotal = computed(() =>
    this.cart().reduce(
      (sum, item) => sum + this.toNumber(item.pizza.price) * item.quantity,
      0,
    ),
  );

  cartTotalWithDiscount = computed(() => {
    const total = this.cartTotal();
    return this.isDiscountApplied()
      ? Math.round(total * 0.9 * 100) / 100
      : total;
  });

  canConfirmOrder = computed(
    () => this.selectedCustomerId() !== null && this.cart().length > 0,
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

  toNumber(value: number | string): number {
    return typeof value === 'string' ? parseFloat(value) : value;
  }

  formatCurrency(value: number | string): string {
    const num = this.toNumber(value);
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
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
      PENDING: 'order-status-select status-pending',
      PREPARING: 'order-status-select status-preparing',
      DELIVERED: 'order-status-select status-delivered',
      CANCELED: 'order-status-select status-canceled',
    };
    return classes[status] ?? 'order-status-select status-pending';
  }

  getOrderItemsSummary(order: Order): string {
    return order.items
      .map((item) => `${item.quantity}x ${item.pizza?.flavorName ?? 'Pizza'}`)
      .join(', ');
  }

  // --- Create ---

  openCreateModal() {
    this.editingOrderId.set(null);
    this.cart.set([]);
    this.selectedCustomerId.set(null);
    this.selectedPizzaId.set(null);
    this.selectedQuantity.set(1);
    this.discountEligible.set(false);
    this.isDiscountApplied.set(false);
    this.errorMessage.set(null);
    this.showOrderModal.set(true);
  }

  // --- Edit ---

  openEditModal(order: Order) {
    this.editingOrderId.set(order.id);
    this.selectedCustomerId.set(order.customer.id);
    this.selectedPizzaId.set(null);
    this.selectedQuantity.set(1);
    this.isDiscountApplied.set(order.isDiscountApplied);
    this.discountEligible.set(order.isDiscountApplied);
    this.errorMessage.set(null);

    const cartItems: CartItem[] = order.items.map((item) => ({
      pizza: item.pizza,
      quantity: item.quantity,
    }));
    this.cart.set(cartItems);

    this.showOrderModal.set(true);
  }

  closeModal() {
    this.showOrderModal.set(false);
    this.editingOrderId.set(null);
  }

  // --- Customer selection ---

  onCustomerChange(customerId: number | null) {
    this.selectedCustomerId.set(customerId);
    this.discountEligible.set(false);
    this.isDiscountApplied.set(false);

    if (!customerId) return;

    this.ordersService.checkDiscount(customerId).subscribe({
      next: (result) => {
        if (result.eligible) {
          const customer = this.customers().find((c) => c.id === customerId);
          this.discountCustomerName.set(customer?.name ?? 'Cliente');
          this.discountEligible.set(true);
          this.showDiscountModal.set(true);
        }
      },
    });
  }

  applyDiscount(apply: boolean) {
    this.isDiscountApplied.set(apply);
    this.showDiscountModal.set(false);
  }

  // --- Cart ---

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
            : item,
        );
      }
      return [...current, { pizza, quantity: qty }];
    });

    this.selectedPizzaId.set(null);
    this.selectedQuantity.set(1);
  }

  removeFromCart(pizzaId: number) {
    this.cart.update((list) =>
      list.filter((item) => item.pizza.id !== pizzaId),
    );
  }

  // --- Submit ---

  submitOrder() {
    if (this.isEditMode()) {
      this.submitEdit();
    } else {
      this.submitCreate();
    }
  }

  private submitCreate() {
    const customerId = this.selectedCustomerId();
    if (!customerId || this.cart().length === 0 || this.isSaving()) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const items = this.buildItemsDto();

    this.ordersService
      .create({
        customerId,
        items,
        isDiscountApplied: this.isDiscountApplied(),
      })
      .subscribe({
        next: (order) => {
          this.orders.update((list) => [order, ...list]);
          this.showOrderModal.set(false);
          this.isSaving.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.extractError(err));
          this.isSaving.set(false);
        },
      });
  }

  private submitEdit() {
    const orderId = this.editingOrderId();
    const customerId = this.selectedCustomerId();
    if (!orderId || !customerId || this.cart().length === 0 || this.isSaving())
      return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const items = this.buildItemsDto();

    this.ordersService
      .update(orderId, {
        customerId,
        items,
        isDiscountApplied: this.isDiscountApplied(),
      })
      .subscribe({
        next: (updated) => {
          this.orders.update((list) =>
            list.map((o) => (o.id === updated.id ? updated : o)),
          );
          this.showOrderModal.set(false);
          this.editingOrderId.set(null);
          this.isSaving.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.extractError(err));
          this.isSaving.set(false);
        },
      });
  }

  private buildItemsDto(): CreateOrderItemDto[] {
    return this.cart().map((item) => ({
      pizzaId: item.pizza.id,
      quantity: item.quantity,
      unitPrice: this.toNumber(item.pizza.price),
    }));
  }

  // --- Status ---

  updateStatus(orderId: number, newStatus: OrderStatus) {
    this.ordersService.updateStatus(orderId, newStatus).subscribe({
      next: (updated) => {
        this.orders.update((list) =>
          list.map((o) => (o.id === updated.id ? updated : o)),
        );
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractError(err));
      },
    });
  }

  // --- Delete ---

  confirmDelete(id: number) {
    this.deleteConfirmId.set(id);
  }

  executeDelete() {
    const id = this.deleteConfirmId();
    if (!id) return;

    this.ordersService.delete(id).subscribe({
      next: () => {
        this.orders.update((list) => list.filter((o) => o.id !== id));
        this.deleteConfirmId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractError(err));
        this.deleteConfirmId.set(null);
      },
    });
  }

  // --- Helpers ---

  private extractError(err: HttpErrorResponse): string {
    const msg = err.error?.message;
    if (Array.isArray(msg)) return msg.join(' | ');
    if (typeof msg === 'string') return msg;
    if (err.status === 400)
      return 'Dados inválidos. Verifique os campos e tente novamente.';
    return 'Ocorreu um erro. Tente novamente.';
  }
}
