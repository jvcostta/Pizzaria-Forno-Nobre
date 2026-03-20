import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PizzasService } from './pizzas.service';
import { CreatePizzaDto } from './dto/create-pizza.dto';
import { UpdatePizzaDto } from './dto/update-pizza.dto';

@UseGuards(JwtAuthGuard)
@Controller('pizzas')
export class PizzasController {
  constructor(private readonly pizzasService: PizzasService) {}

  @Post()
  create(@Body() dto: CreatePizzaDto) {
    return this.pizzasService.create(dto);
  }

  @Get()
  findAll(@Query('active') active?: string) {
    const activeOnly = active !== 'false';
    return this.pizzasService.findAll(activeOnly);
  }

  @Get('top-sellers')
  findTopSellers(@Query('limit') limit?: string) {
    return this.pizzasService.findTopSellers(limit ? parseInt(limit, 10) : 10);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.pizzasService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePizzaDto,
  ) {
    return this.pizzasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pizzasService.remove(id);
  }
}
