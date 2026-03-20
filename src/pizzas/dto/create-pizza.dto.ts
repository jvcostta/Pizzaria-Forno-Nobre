import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePizzaDto {
  @IsNotEmpty({ message: 'O nome do sabor é obrigatório' })
  @IsString()
  flavorName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value.replace(',', '.'));
    }
    return value;
  })
  @IsNumber({}, { message: 'O preço deve ser um número' })
  @IsPositive({ message: 'O preço deve ser positivo' })
  price: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
