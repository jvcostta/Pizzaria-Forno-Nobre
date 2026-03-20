import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomersService } from '../../../core/services/customers.service';
import { Customer } from '../../../core/models/customer.model';

@Component({
  selector: 'app-clientes',
  imports: [ReactiveFormsModule],
  templateUrl: './clientes.component.html',
})
export class ClientesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customersService = inject(CustomersService);

  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  customers = signal<Customer[]>([]);
  searchQuery = signal('');
  showCreateModal = signal(false);
  showEditModal = signal(false);
  selectedCustomer = signal<Customer | null>(null);
  deleteConfirmId = signal<number | null>(null);

  filteredCustomers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.customers();
    return this.customers().filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query))
    );
  });

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.email]],
    address: ['', [Validators.required]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
  });

  editForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.email]],
    address: ['', [Validators.required]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.isLoading.set(true);
    this.customersService.getAll().subscribe({
      next: (data) => {
        this.customers.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openCreate() {
    this.createForm.reset();
    this.showCreateModal.set(true);
  }

  openEdit(customer: Customer) {
    this.selectedCustomer.set(customer);
    this.editForm.patchValue({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? '',
      address: customer.address,
      cpf: customer.cpf ?? '',
    });
    this.showEditModal.set(true);
  }

  submitCreate() {
    if (this.createForm.invalid || this.isSaving()) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { name, phone, email, address, cpf } = this.createForm.value;
    this.customersService
      .create({ name: name!, phone: phone!, email: email ?? undefined, address: address!, cpf: cpf! })
      .subscribe({
        next: (customer) => {
          this.customers.update((list) => [...list, customer]);
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
    const customer = this.selectedCustomer();
    if (this.editForm.invalid || this.isSaving() || !customer) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { name, phone, email, address, cpf } = this.editForm.value;
    this.customersService
      .update(customer.id, { name: name!, phone: phone!, email: email ?? undefined, address: address!, cpf: cpf! })
      .subscribe({
        next: (updated) => {
          this.customers.update((list) =>
            list.map((c) => (c.id === updated.id ? updated : c))
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
    this.customersService.delete(id).subscribe({
      next: () => {
        this.customers.update((list) => list.filter((c) => c.id !== id));
        this.deleteConfirmId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractError(err));
        this.deleteConfirmId.set(null);
      },
    });
  }

  private extractError(err: HttpErrorResponse): string {
    const msg = err.error?.message;
    if (Array.isArray(msg)) return msg.join(' | ');
    if (typeof msg === 'string') return msg;
    if (err.status === 409) return 'CPF já cadastrado.';
    if (err.status === 400) return 'Dados inválidos. Verifique os campos e tente novamente.';
    return 'Ocorreu um erro. Tente novamente.';
  }
}
