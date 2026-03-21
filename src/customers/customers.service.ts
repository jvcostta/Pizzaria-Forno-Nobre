import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { isValidCpf } from '../common/utils/cpf-validator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    if (!isValidCpf(dto.cpf)) {
      throw new BadRequestException('CPF inválido');
    }

    const customer = this.customerRepository.create({
      ...dto,
      cpf: dto.cpf.replace(/\D/g, ''),
    });

    return this.customerRepository.save(customer);
  }

  async findAll(): Promise<(Customer & { totalOrders: number })[]> {
    const customers = await this.customerRepository
      .createQueryBuilder('customer')
      .loadRelationCountAndMap('customer.totalOrders', 'customer.orders')
      .orderBy('customer.name', 'ASC')
      .getMany();

    return customers as (Customer & { totalOrders: number })[];
  }

  async findById(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOneBy({ id });
    if (!customer) {
      throw new NotFoundException(`Cliente #${id} não encontrado`);
    }
    return customer;
  }

  async findByCpf(cpf: string): Promise<Customer | null> {
    const cleaned = cpf.replace(/\D/g, '');
    return this.customerRepository.findOneBy({ cpf: cleaned });
  }

  async update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findById(id);

    if (dto.cpf) {
      if (!isValidCpf(dto.cpf)) {
        throw new BadRequestException('CPF inválido');
      }
      dto.cpf = dto.cpf.replace(/\D/g, '');
    }

    Object.assign(customer, dto);
    return this.customerRepository.save(customer);
  }

  async remove(id: number): Promise<void> {
    const customer = await this.findById(id);
    await this.customerRepository.remove(customer);
  }
}
