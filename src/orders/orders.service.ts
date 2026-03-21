import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { OrderStatus } from './enums/order-status.enum';
import { LoyaltyService } from './loyalty.service';
import { calculateOrderTotal } from '../common/utils/order-calculator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const isDiscountApplied = dto.isDiscountApplied ?? false;

    const items = dto.items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));

    const { totalValue, discountApplied, finalValue } = calculateOrderTotal(
      items,
      isDiscountApplied,
    );

    const order = this.orderRepository.create({
      customerId: dto.customerId,
      totalValue,
      discountApplied,
      finalValue,
      isDiscountApplied,
      items: dto.items.map((i) => ({
        pizzaId: i.pizzaId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        notes: i.notes,
      })),
    });

    const saved = await this.orderRepository.save(order);
    return this.findById(saved.id);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['items', 'items.pizza', 'customer'],
      order: { orderDate: 'DESC' },
    });
  }

  async findById(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.pizza', 'customer'],
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

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.findById(id);

    if (dto.customerId !== undefined) {
      order.customerId = dto.customerId;
    }

    if (dto.status !== undefined) {
      order.status = dto.status;
    }

    if (dto.isDiscountApplied !== undefined) {
      order.isDiscountApplied = dto.isDiscountApplied;
    }

    if (dto.items) {
      const itemRepo = this.orderRepository.manager.getRepository(OrderItem);
      await itemRepo.delete({ orderId: id });

      order.items = dto.items.map((i) => {
        const item = new OrderItem();
        item.orderId = id;
        item.pizzaId = i.pizzaId!;
        item.quantity = i.quantity;
        item.unitPrice = i.unitPrice;
        item.notes = i.notes!;
        return item;
      });
    }

    const itemsForCalc = (dto.items ?? order.items).map((i) => ({
      quantity: i.quantity,
      unitPrice: typeof i.unitPrice === 'string' ? parseFloat(i.unitPrice) : i.unitPrice,
    }));

    const { totalValue, discountApplied, finalValue } = calculateOrderTotal(
      itemsForCalc,
      order.isDiscountApplied,
    );

    order.totalValue = totalValue;
    order.discountApplied = discountApplied;
    order.finalValue = finalValue;

    await this.orderRepository.save(order);
    return this.findById(id);
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.findById(id);
    order.status = status;
    await this.orderRepository.save(order);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findById(id);
    await this.orderRepository.remove(order);
  }

  async checkDiscount(
    customerId: number,
  ): Promise<{ eligible: boolean; completedOrders: number }> {
    const completedOrders =
      await this.loyaltyService.getCompletedOrderCount(customerId);
    const eligible = await this.loyaltyService.hasDiscount(customerId);
    return { eligible, completedOrders };
  }
}
