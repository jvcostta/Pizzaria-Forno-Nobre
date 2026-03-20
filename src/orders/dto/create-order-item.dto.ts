import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsOptional()
  @IsInt()
  pizzaId?: number;

  @IsInt()
  @Min(1, { message: 'A quantidade mínima é 1' })
  quantity: number;

  @IsNumber()
  @IsPositive({ message: 'O preço unitário deve ser positivo' })
  unitPrice: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
