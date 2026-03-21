import { Customer } from './customer.model';
import { Pizza } from './pizza.model';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'DELIVERED' | 'CANCELED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  PREPARING: 'Preparando',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-red-100 text-red-800',
};

export interface OrderItem {
  id: number;
  pizza: Pizza;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: number;
  customer: Customer;
  items: OrderItem[];
  status: OrderStatus;
  totalValue: number;
  discountApplied: number;
  finalValue: number;
  isDiscountApplied: boolean;
  orderDate: string;
}

export interface CreateOrderItemDto {
  pizzaId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface CreateOrderDto {
  customerId: number;
  items: CreateOrderItemDto[];
  isDiscountApplied?: boolean;
}

export interface DiscountCheck {
  eligible: boolean;
  completedOrders: number;
}
