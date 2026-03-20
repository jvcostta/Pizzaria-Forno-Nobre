import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pizza, TopSeller, CreatePizzaDto, UpdatePizzaDto } from '../models/pizza.model';

@Injectable({ providedIn: 'root' })
export class PizzasService {
  private readonly http = inject(HttpClient);
  private readonly BASE = '/api/pizzas';

  getAll(includeInactive = false) {
    const params = includeInactive ? '?active=false' : '';
    return this.http.get<Pizza[]>(`${this.BASE}${params}`);
  }

  getTopSellers(limit = 5) {
    return this.http.get<TopSeller[]>(`${this.BASE}/top-sellers?limit=${limit}`);
  }

  getById(id: number) {
    return this.http.get<Pizza>(`${this.BASE}/${id}`);
  }

  create(dto: CreatePizzaDto) {
    return this.http.post<Pizza>(this.BASE, dto);
  }

  update(id: number, dto: UpdatePizzaDto) {
    return this.http.patch<Pizza>(`${this.BASE}/${id}`, dto);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
