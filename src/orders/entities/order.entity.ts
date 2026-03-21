import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderItem } from '../../order-items/entities/order-item.entity';
import { OrderStatus } from '../enums/order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: number;

  @CreateDateColumn({ name: 'order_date' })
  orderDate: Date;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    name: 'total_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalValue: number;

  @Column({
    name: 'discount_applied',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountApplied: number;

  @Column({
    name: 'final_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  finalValue: number;

  @Column({
    name: 'is_discount_applied',
    type: 'boolean',
    default: false,
  })
  isDiscountApplied: boolean;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];
}
