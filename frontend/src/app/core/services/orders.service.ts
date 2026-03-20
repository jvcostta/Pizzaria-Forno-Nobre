import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order, CreateOrderDto, OrderStatus } from '../models/order.model';

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

  updateStatus(id: number, status: OrderStatus) {
    return this.http.patch<Order>(`${this.BASE}/${id}/status`, { status });
  }
}
