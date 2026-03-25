import 'zone.js';
import 'zone.js/testing';
import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// Inicializa o ambiente Angular de testes antes de qualquer describe
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
  teardown: { destroyAfterEach: false },
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let mockAuthService: {
    login: ReturnType<typeof vi.fn>;
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    token: ReturnType<typeof signal<string | null>>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn(),
      isAuthenticated: signal(false),
      token: signal<string | null>(null),
    };
    mockRouter = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve estar definido', () => {
    expect(component).toBeDefined();
  });

  it('deve redirecionar para /dashboard após login bem-sucedido', () => {
    // Arrange — of() é síncrono, não precisa de fakeAsync
    mockAuthService.login.mockReturnValue(of({ access_token: 'token123' }));
    component.form.setValue({ username: 'admin', password: 'admin123' });

    // Act
    component.onSubmit();

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('deve exibir mensagem de erro quando o login falha', () => {
    // Arrange — throwError() é síncrono
    mockAuthService.login.mockReturnValue(throwError(() => ({ status: 401 })));
    component.form.setValue({ username: 'admin', password: 'errado' });

    // Act
    component.onSubmit();

    // Assert
    expect(component.errorMessage()).toBe('Usuário ou senha inválidos. Tente novamente.');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('NÃO deve chamar o serviço de login quando a senha tem menos de 4 caracteres', () => {
    // Arrange
    component.form.setValue({ username: 'admin', password: '123' });

    // Act
    component.onSubmit();

    // Assert
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('NÃO deve chamar o serviço de login quando o username está vazio', () => {
    // Arrange
    component.form.setValue({ username: '', password: 'admin123' });

    // Act
    component.onSubmit();

    // Assert
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('deve definir isLoading como false após erro no login', () => {
    // Arrange
    mockAuthService.login.mockReturnValue(throwError(() => ({ status: 401 })));
    component.form.setValue({ username: 'admin', password: 'errado' });

    // Act
    component.onSubmit();

    // Assert
    expect(component.isLoading()).toBe(false);
  });
});
