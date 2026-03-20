import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';

const LOYALTY_CYCLE = 3;

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async hasDiscount(customerId: number): Promise<boolean> {
    const orderCount = await this.orderRepository.count({
      where: { customerId },
    });

    return orderCount % LOYALTY_CYCLE === LOYALTY_CYCLE - 1;
  }
}
