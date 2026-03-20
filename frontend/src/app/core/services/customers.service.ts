import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/customers';

  getAll() {
    return this.http.get<Customer[]>(this.BASE);
  }

  getById(id: number) {
    return this.http.get<Customer>(`${this.BASE}/${id}`);
  }

  create(dto: CreateCustomerDto) {
    return this.http.post<Customer>(this.BASE, dto);
  }

  update(id: number, dto: UpdateCustomerDto) {
    return this.http.patch<Customer>(`${this.BASE}/${id}`, dto);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
