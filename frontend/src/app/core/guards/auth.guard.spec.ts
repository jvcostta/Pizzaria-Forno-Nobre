import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Injector } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  const executarGuard = (
    mockAuthService: { isAuthenticated: ReturnType<typeof signal<boolean>> },
    mockRouter: { createUrlTree: ReturnType<typeof vi.fn> },
  ) => {
    const injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    return injector.runInContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  };

  it('deve permitir acesso quando o usuário está autenticado', () => {
    // Arrange
    const mockAuthService = { isAuthenticated: signal(true) };
    const mockRouter = { createUrlTree: vi.fn() };

    // Act
    const result = executarGuard(mockAuthService, mockRouter);

    // Assert
    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('deve bloquear acesso e redirecionar para /login quando não autenticado', () => {
    // Arrange
    const mockAuthService = { isAuthenticated: signal(false) };
    const mockRouter = { createUrlTree: vi.fn().mockReturnValue('url-tree-login') };

    // Act
    const result = executarGuard(mockAuthService, mockRouter);

    // Assert
    expect(result).not.toBe(true);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
