export type PizzaCategory = 'Salgada' | 'Doce' | 'Especial';

export interface Pizza {
  id: number;
  flavorName: string;
  description: string;
  price: number;
  category?: PizzaCategory;
  isActive: boolean;
  createdAt?: string;
}

export interface TopSeller {
  pizzaId: number;
  flavorName: string;
  totalSold: number;
}

export interface CreatePizzaDto {
  flavorName: string;
  description: string;
  price: number;
  category?: PizzaCategory;
  isActive?: boolean;
}

export type UpdatePizzaDto = Partial<CreatePizzaDto>;
