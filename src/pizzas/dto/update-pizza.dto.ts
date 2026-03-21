import {
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePizzaDto {
  @IsOptional()
  @IsString()
  flavorName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value.replace(',', '.'));
    }
    return value;
  })
  @IsNumber({}, { message: 'O preço deve ser um número' })
  @IsPositive({ message: 'O preço deve ser positivo' })
  price?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
