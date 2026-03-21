import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Order,
  CreateOrderDto,
  CreateOrderItemDto,
  OrderStatus,
  DiscountCheck,
} from '../models/order.model';

export interface UpdateOrderDto {
  customerId?: number;
  status?: OrderStatus;
  items?: CreateOrderItemDto[];
  isDiscountApplied?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/orders';

  getAll() {
    return this.http.get<Order[]>(this.BASE);
  }

  getById(id: number) {
    return this.http.get<Order>(`${this.BASE}/${id}`);
  }

  create(dto: CreateOrderDto) {
    return this.http.post<Order>(this.BASE, dto);
  }

  update(id: number, dto: UpdateOrderDto) {
    return this.http.patch<Order>(`${this.BASE}/${id}`, dto);
  }

  updateStatus(id: number, status: OrderStatus) {
    return this.http.patch<Order>(`${this.BASE}/${id}/status`, { status });
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  checkDiscount(customerId: number) {
    return this.http.get<DiscountCheck>(
      `${this.BASE}/check-discount/${customerId}`,
    );
  }
}
