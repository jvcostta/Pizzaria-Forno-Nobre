import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PizzasService } from '../../../core/services/pizzas.service';
import { Pizza, PizzaCategory } from '../../../core/models/pizza.model';

interface CategoryConfig {
  label: string;
  badgeClass: string;
  gradientClass: string;
  emoji: string;
}

@Component({
  selector: 'app-sabores',
  imports: [ReactiveFormsModule],
  templateUrl: './sabores.component.html',
})
export class SaboresComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pizzasService = inject(PizzasService);

  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  pizzas = signal<Pizza[]>([]);
  showCreateModal = signal(false);
  showEditModal = signal(false);
  selectedPizza = signal<Pizza | null>(null);
  deleteConfirmId = signal<number | null>(null);

  activePizzas = computed(() => this.pizzas().filter((p) => p.isActive));

  categories: PizzaCategory[] = ['Salgada', 'Doce', 'Especial'];

  categoryConfig: Record<string, CategoryConfig> = {
    Salgada: {
      label: 'Salgada',
      badgeClass: 'bg-orange-100 text-orange-700',
      gradientClass: 'from-orange-400 to-red-500',
      emoji: '🍕',
    },
    Doce: {
      label: 'Doce',
      badgeClass: 'bg-purple-100 text-purple-700',
      gradientClass: 'from-pink-400 to-purple-500',
      emoji: '🍫',
    },
    Especial: {
      label: 'Especial',
      badgeClass: 'bg-blue-100 text-blue-700',
      gradientClass: 'from-blue-400 to-indigo-600',
      emoji: '⭐',
    },
  };

  createForm = this.fb.group({
    flavorName: ['', [Validators.required, Validators.minLength(2)]],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
    category: ['Salgada' as PizzaCategory, [Validators.required]],
    description: ['', [Validators.required]],
    isActive: [true],
  });

  editForm = this.fb.group({
    flavorName: ['', [Validators.required, Validators.minLength(2)]],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
    category: ['Salgada' as PizzaCategory, [Validators.required]],
    description: ['', [Validators.required]],
    isActive: [true],
  });

  ngOnInit() {
    this.loadPizzas();
  }

  loadPizzas() {
    this.isLoading.set(true);
    this.pizzasService.getAll().subscribe({
      next: (data) => {
        this.pizzas.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  getCategoryConfig(category?: string): CategoryConfig {
    return this.categoryConfig[category ?? 'Salgada'] ?? this.categoryConfig['Salgada'];
  }

  formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  openCreate() {
    this.createForm.reset({ category: 'Salgada', isActive: true });
    this.showCreateModal.set(true);
  }

  openEdit(pizza: Pizza) {
    this.selectedPizza.set(pizza);
    this.editForm.patchValue({
      flavorName: pizza.flavorName,
      price: pizza.price,
      category: pizza.category ?? 'Salgada',
      description: pizza.description,
      isActive: pizza.isActive,
    });
    this.showEditModal.set(true);
  }

  submitCreate() {
    if (this.createForm.invalid || this.isSaving()) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { flavorName, price, category, description, isActive } = this.createForm.value;
    this.pizzasService
      .create({
        flavorName: flavorName!,
        price: this.parsePrice(price),
        category: category as PizzaCategory,
        description: description!,
        isActive: isActive ?? true,
      })
      .subscribe({
        next: (pizza) => {
          this.pizzas.update((list) => [...list, pizza]);
          this.showCreateModal.set(false);
          this.isSaving.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.extractError(err));
          this.isSaving.set(false);
        },
      });
  }

  submitEdit() {
    const pizza = this.selectedPizza();
    if (this.editForm.invalid || this.isSaving() || !pizza) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { flavorName, price, category, description, isActive } = this.editForm.value;
    this.pizzasService
      .update(pizza.id, {
        flavorName: flavorName!,
        price: this.parsePrice(price),
        category: category as PizzaCategory,
        description: description!,
        isActive: isActive ?? true,
      })
      .subscribe({
        next: (updated) => {
          this.pizzas.update((list) =>
            list.map((p) => (p.id === updated.id ? updated : p))
          );
          this.showEditModal.set(false);
          this.isSaving.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.extractError(err));
          this.isSaving.set(false);
        },
      });
  }

  confirmDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja excluir este item?')) return;
    this.deleteConfirmId.set(id);
    this.executeDelete();
  }

  executeDelete() {
    const id = this.deleteConfirmId();
    if (!id) return;
    this.pizzasService.delete(id).subscribe({
      next: () => {
        this.pizzas.update((list) => list.filter((p) => p.id !== id));
        this.deleteConfirmId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractError(err));
        this.deleteConfirmId.set(null);
      },
    });
  }

  private parsePrice(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') {
      return parseFloat(value.replace(',', '.')) || 0;
    }
    return value;
  }

  private extractError(err: HttpErrorResponse): string {
    const msg = err.error?.message;
    if (Array.isArray(msg)) return msg.join(' | ');
    if (typeof msg === 'string') return msg;
    if (err.status === 400) return 'Dados inválidos. Verifique os campos e tente novamente.';
    return 'Ocorreu um erro. Tente novamente.';
  }
}
