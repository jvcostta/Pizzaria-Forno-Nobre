import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { LoyaltyService } from './loyalty.service';
import { calculateOrderTotal } from '../common/utils/order-calculator';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const hasDiscount = await this.loyaltyService.hasDiscount(dto.customerId);

    const items = dto.items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));

    const { totalValue, discountApplied, finalValue } = calculateOrderTotal(
      items,
      hasDiscount,
    );

    const order = this.orderRepository.create({
      customerId: dto.customerId,
      totalValue,
      discountApplied,
      finalValue,
      items: dto.items.map((i) => ({
        pizzaId: i.pizzaId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        notes: i.notes,
      })),
    });

    return this.orderRepository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['items', 'customer'],
      order: { orderDate: 'DESC' },
    });
  }

  async findById(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'customer'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido #${id} não encontrado`);
    }

    return order;
  }

  async findByCustomerId(customerId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customerId },
      relations: ['items'],
      order: { orderDate: 'DESC' },
    });
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.findById(id);
    order.status = status;
    return this.orderRepository.save(order);
  }
}
