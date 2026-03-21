export interface Customer {
  id: number;
  name: string;
  cpf?: string;
  phone: string;
  email?: string;
  address: string;
  createdAt?: string;
  totalOrders?: number;
}

export interface CreateCustomerDto {
  name: string;
  cpf?: string;
  phone: string;
  email?: string;
  address: string;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;
