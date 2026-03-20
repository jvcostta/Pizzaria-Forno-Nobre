import { IsEnum } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message: `Status deve ser um de: ${Object.values(OrderStatus).join(', ')}`,
  })
  status: OrderStatus;
}
