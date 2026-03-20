import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrderItemsService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async create(data: Partial<OrderItem>): Promise<OrderItem> {
    const item = this.orderItemRepository.create(data);
    return this.orderItemRepository.save(item);
  }

  async findByOrderId(orderId: number): Promise<OrderItem[]> {
    return this.orderItemRepository.find({ where: { orderId } });
  }
}
