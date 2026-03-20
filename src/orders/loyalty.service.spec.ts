import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoyaltyService } from './loyalty.service';
import { Order } from './entities/order.entity';

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

  it('NÃO deve dar desconto quando cliente tem 0 pedidos (1º pedido)', () => {
    mockOrderRepository.count.mockResolvedValue(0);
    return expect(service.hasDiscount(1)).resolves.toBe(false);
  });

  it('NÃO deve dar desconto quando cliente tem 1 pedido (2º pedido)', () => {
    mockOrderRepository.count.mockResolvedValue(1);
    return expect(service.hasDiscount(1)).resolves.toBe(false);
  });

  it('DEVE dar desconto quando cliente tem 2 pedidos (3º pedido)', () => {
    mockOrderRepository.count.mockResolvedValue(2);
    return expect(service.hasDiscount(1)).resolves.toBe(true);
  });

  it('NÃO deve dar desconto quando cliente tem 3 pedidos (4º pedido)', () => {
    mockOrderRepository.count.mockResolvedValue(3);
    return expect(service.hasDiscount(1)).resolves.toBe(false);
  });

  it('NÃO deve dar desconto quando cliente tem 4 pedidos (5º pedido)', () => {
    mockOrderRepository.count.mockResolvedValue(4);
    return expect(service.hasDiscount(1)).resolves.toBe(false);
  });

  it('DEVE dar desconto quando cliente tem 5 pedidos (6º pedido - segundo ciclo)', () => {
    mockOrderRepository.count.mockResolvedValue(5);
    return expect(service.hasDiscount(1)).resolves.toBe(true);
  });

  it('DEVE dar desconto quando cliente tem 8 pedidos (9º pedido - terceiro ciclo)', () => {
    mockOrderRepository.count.mockResolvedValue(8);
    return expect(service.hasDiscount(1)).resolves.toBe(true);
  });

  it('deve consultar o repositório com o customerId correto', async () => {
    mockOrderRepository.count.mockResolvedValue(0);
    await service.hasDiscount(42);

    expect(mockOrderRepository.count).toHaveBeenCalledWith({
      where: { customerId: 42 },
    });
  });
});
