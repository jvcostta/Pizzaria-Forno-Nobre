import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pizza } from './entities/pizza.entity';
import { CreatePizzaDto } from './dto/create-pizza.dto';
import { UpdatePizzaDto } from './dto/update-pizza.dto';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';

@Injectable()
export class PizzasService {
  constructor(
    @InjectRepository(Pizza)
    private readonly pizzaRepository: Repository<Pizza>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async create(dto: CreatePizzaDto): Promise<Pizza> {
    const pizza = this.pizzaRepository.create(dto);
    return this.pizzaRepository.save(pizza);
  }

  async findAll(activeOnly = true): Promise<Pizza[]> {
    if (activeOnly) {
      return this.pizzaRepository.find({ where: { isActive: true } });
    }
    return this.pizzaRepository.find();
  }

  async findById(id: number): Promise<Pizza> {
    const pizza = await this.pizzaRepository.findOneBy({ id });
    if (!pizza) {
      throw new NotFoundException(`Pizza #${id} não encontrada`);
    }
    return pizza;
  }

  async update(id: number, dto: UpdatePizzaDto): Promise<Pizza> {
    const pizza = await this.findById(id);
    Object.assign(pizza, dto);
    return this.pizzaRepository.save(pizza);
  }

  async remove(id: number): Promise<void> {
    const pizza = await this.findById(id);
    await this.pizzaRepository.remove(pizza);
  }

  async findTopSellers(
    limit = 10,
  ): Promise<{ pizzaId: number; flavorName: string; totalSold: number }[]> {
    const rows = await this.orderItemRepository
      .createQueryBuilder('item')
      .select('item.pizza_id', 'pizzaId')
      .addSelect('pizza.flavor_name', 'flavorName')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'totalSold')
      .innerJoin('item.pizza', 'pizza')
      .innerJoin('item.order', 'order')
      .where('order.status != :canceled', { canceled: OrderStatus.CANCELED })
      .groupBy('item.pizza_id')
      .addGroupBy('pizza.flavor_name')
      .orderBy('"totalSold"', 'DESC')
      .limit(limit)
      .getRawMany<{ pizzaId: number; flavorName: string; totalSold: string }>();

    return rows.map((row) => ({
      pizzaId: Number(row.pizzaId),
      flavorName: row.flavorName,
      totalSold: Number(row.totalSold) || 0,
    }));
  }
}
