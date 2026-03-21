import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';

const LOYALTY_CYCLE = 3;
const QUALIFYING_STATUSES: OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.PREPARING,
];

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async hasDiscount(customerId: number): Promise<boolean> {
    const orderCount = await this.orderRepository.count({
      where: {
        customerId,
        status: In(QUALIFYING_STATUSES),
      },
    });

    return orderCount > 0 && orderCount % LOYALTY_CYCLE === LOYALTY_CYCLE - 1;
  }

  async getCompletedOrderCount(customerId: number): Promise<number> {
    return this.orderRepository.count({
      where: {
        customerId,
        status: In(QUALIFYING_STATUSES),
      },
    });
  }
}
