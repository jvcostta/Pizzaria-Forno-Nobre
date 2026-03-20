import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pizza } from './entities/pizza.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { PizzasService } from './pizzas.service';
import { PizzasController } from './pizzas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pizza, OrderItem])],
  controllers: [PizzasController],
  providers: [PizzasService],
  exports: [PizzasService],
})
export class PizzasModule {}
