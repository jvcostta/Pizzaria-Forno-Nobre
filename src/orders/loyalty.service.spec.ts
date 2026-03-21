import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoyaltyService } from './loyalty.service';
import { Order } from './entities/order.entity';
import { In } from 'typeorm';
import { OrderStatus } from './enums/order-status.enum';

const QUALIFYING_STATUSES = [OrderStatus.DELIVERED, OrderStatus.PREPARING];

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let mockOrderRepository: { count: jest.Mock };

  beforeEach(async () => {
    mockOrderRepository = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('NÃO deve dar desconto quando cliente tem 0 pedidos qualificados (1º pedido)', () => {
    mockOrderRepository.count.mockResolvedValue(0);
    return expect(service.hasDiscount(1)).resolves.toBe(false);
  });

  it('NÃO deve dar desconto quando cliente tem 1 pedido qualificado (2º pedido)', () => {
    mockOrderRepository.count.mockResolvedValue(1);
    return expect(service.hasDiscount(1)).resolves.toBe(false);
  });

  it('DEVE dar desconto quando cliente tem 2 pedidos qualificados (3º pedido)', () => {
    mockOrderRepository.count.mockResolvedValue(2);
    return expect(service.hasDiscount(1)).resolves.toBe(true);
  });

  it('NÃO deve dar desconto quando cliente tem 3 pedidos qualificados (4º pedido)', () => {
    mockOrderRepository.count.mockResolvedValue(3);
    return expect(service.hasDiscount(1)).resolves.toBe(false);
  });

  it('NÃO deve dar desconto quando cliente tem 4 pedidos qualificados (5º pedido)', () => {
    mockOrderRepository.count.mockResolvedValue(4);
    return expect(service.hasDiscount(1)).resolves.toBe(false);
  });

  it('DEVE dar desconto quando cliente tem 5 pedidos qualificados (6º pedido - segundo ciclo)', () => {
    mockOrderRepository.count.mockResolvedValue(5);
    return expect(service.hasDiscount(1)).resolves.toBe(true);
  });

  it('DEVE dar desconto quando cliente tem 8 pedidos qualificados (9º pedido - terceiro ciclo)', () => {
    mockOrderRepository.count.mockResolvedValue(8);
    return expect(service.hasDiscount(1)).resolves.toBe(true);
  });

  it('deve consultar apenas pedidos com status DELIVERED ou PREPARING', async () => {
    mockOrderRepository.count.mockResolvedValue(0);
    await service.hasDiscount(42);

    expect(mockOrderRepository.count).toHaveBeenCalledWith({
      where: {
        customerId: 42,
        status: In(QUALIFYING_STATUSES),
      },
    });
  });

  describe('getCompletedOrderCount', () => {
    it('deve retornar a contagem de pedidos qualificados', async () => {
      mockOrderRepository.count.mockResolvedValue(5);
      const count = await service.getCompletedOrderCount(10);
      expect(count).toBe(5);
    });
  });
});
