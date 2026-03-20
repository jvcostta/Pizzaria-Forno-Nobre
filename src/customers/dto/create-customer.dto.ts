import {
  IsNotEmpty,
  IsString,
  IsOptional,
  Matches,
  IsEmail,
} from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  @Matches(/^\d{11}$/, { message: 'O CPF deve conter exatamente 11 dígitos numéricos' })
  cpf: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;
}
