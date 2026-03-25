import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector, signal } from '@angular/core';
import { HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { throwError, of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  const executarInterceptor = (
    mockAuthService: { token: ReturnType<typeof signal<string | null>>; logout: ReturnType<typeof vi.fn> },
    req: HttpRequest<unknown>,
    next: (r: HttpRequest<unknown>) => any,
  ) => {
    const injector = Injector.create({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });

    return injector.runInContext(() => authInterceptor(req, next as any));
  };

  it('deve adicionar o header Authorization quando existe um token', () => {
    // Arrange
    const mockAuthService = { token: signal<string | null>('meu-token-jwt'), logout: vi.fn() };
    const req = new HttpRequest('GET', '/api/customers');
    const mockNext = vi.fn().mockReturnValue(of({}));

    // Act
    executarInterceptor(mockAuthService, req, mockNext);

    // Assert
    const reqClonado: HttpRequest<unknown> = mockNext.mock.calls[0][0];
    expect(reqClonado.headers.get('Authorization')).toBe('Bearer meu-token-jwt');
  });

  it('deve passar a requisição sem modificação quando não há token', () => {
    // Arrange
    const mockAuthService = { token: signal<string | null>(null), logout: vi.fn() };
    const req = new HttpRequest('GET', '/api/pizzas');
    const mockNext = vi.fn().mockReturnValue(of({}));

    // Act
    executarInterceptor(mockAuthService, req, mockNext);

    // Assert
    const reqRecebida: HttpRequest<unknown> = mockNext.mock.calls[0][0];
    expect(reqRecebida.headers.has('Authorization')).toBe(false);
  });

  it('deve chamar logout quando a resposta for 401 Unauthorized', () => {
    // Arrange
    const mockAuthService = { token: signal<string | null>('token-expirado'), logout: vi.fn() };
    const req = new HttpRequest('GET', '/api/orders');
    const erro401 = new HttpErrorResponse({ status: 401 });
    const mockNext = vi.fn().mockReturnValue(throwError(() => erro401));

    // Act
    executarInterceptor(mockAuthService, req, mockNext).subscribe({ error: () => {} });

    // Assert
    expect(mockAuthService.logout).toHaveBeenCalledOnce();
  });

  it('NÃO deve chamar logout em erros diferentes de 401', () => {
    // Arrange
    const mockAuthService = { token: signal<string | null>(null), logout: vi.fn() };
    const req = new HttpRequest('GET', '/api/customers');
    const erro500 = new HttpErrorResponse({ status: 500 });
    const mockNext = vi.fn().mockReturnValue(throwError(() => erro500));

    // Act
    executarInterceptor(mockAuthService, req, mockNext).subscribe({ error: () => {} });

    // Assert
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });
});
