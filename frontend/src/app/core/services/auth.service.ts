import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

interface LoginResponse {
  access_token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'forno_nobre_token';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(
    localStorage.getItem(this.TOKEN_KEY)
  );

  readonly isAuthenticated = computed(() => !!this._token());
  readonly token = this._token.asReadonly();

  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>('/api/auth/login', { username, password })
      .pipe(
        tap((response) => {
          this._token.set(response.access_token);
          localStorage.setItem(this.TOKEN_KEY, response.access_token);
        })
      );
  }

  logout() {
    this._token.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }
}
