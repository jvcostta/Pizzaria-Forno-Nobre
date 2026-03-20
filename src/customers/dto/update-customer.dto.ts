import { IsOptional, IsString, Matches, IsEmail } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Matches(/^\d{11}$/, { message: 'O CPF deve conter exatamente 11 dígitos numéricos' })
  cpf?: string;

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
