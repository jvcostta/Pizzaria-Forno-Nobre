import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';
import { OrderStatus } from '../enums/order-status.enum';

export class UpdateOrderDto {
  @IsOptional()
  @IsInt({ message: 'O ID do cliente deve ser um número inteiro' })
  customerId?: number;

  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Status inválido' })
  status?: OrderStatus;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'O pedido deve ter pelo menos 1 item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @IsOptional()
  @IsBoolean()
  isDiscountApplied?: boolean;
}
