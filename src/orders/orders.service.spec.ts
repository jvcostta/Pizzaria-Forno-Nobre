import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { LoyaltyService } from './loyalty.service';
import { OrderStatus } from './enums/order-status.enum';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockOrderRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    remove: jest.Mock;
    manager: { getRepository: jest.Mock };
  };
  let mockLoyaltyService: {
    hasDiscount: jest.Mock;
    getCompletedOrderCount: jest.Mock;
  };
  let mockOrderItemRepository: { delete: jest.Mock };

  const mockOrder: Order = {
    id: 1,
    customerId: 1,
    customer: { id: 1, name: 'João', cpf: '52998224725', phone: '11999999999', address: 'Rua A', email: null, createdAt: new Date(), orders: [] },
    orderDate: new Date(),
    status: OrderStatus.PENDING,
    totalValue: 39.9,
    discountApplied: 0,
    finalValue: 39.9,
    isDiscountApplied: false,
    items: [
      {
        id: 1,
        orderId: 1,
        order: {} as Order,
        pizzaId: 1,
        pizza: null,
        quantity: 1,
        unitPrice: 39.9,
        notes: null,
      },
    ],
  };

  beforeEach(async () => {
    mockOrderItemRepository = { delete: jest.fn() };

    mockOrderRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      manager: {
        getRepository: jest.fn().mockReturnValue(mockOrderItemRepository),
      },
    };

    mockLoyaltyService = {
      hasDiscount: jest.fn(),
      getCompletedOrderCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        { provide: LoyaltyService, useValue: mockLoyaltyService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('deve retornar o pedido com relações carregadas quando o ID existe', async () => {
      // Arrange
      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toBe(mockOrder);
      expect(mockOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['items', 'items.pizza', 'customer'],
      });
    });

    it('deve lançar NotFoundException quando o ID não existe', async () => {
      // Arrange
      mockOrderRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar o status de PENDING para DELIVERED', async () => {
      // Arrange
      const pedidoPendente = { ...mockOrder, status: OrderStatus.PENDING };
      mockOrderRepository.findOne
        .mockResolvedValueOnce(pedidoPendente)
        .mockResolvedValueOnce({ ...pedidoPendente, status: OrderStatus.DELIVERED });
      mockOrderRepository.save.mockResolvedValue({ ...pedidoPendente, status: OrderStatus.DELIVERED });

      // Act
      const result = await service.updateStatus(1, OrderStatus.DELIVERED);

      // Assert
      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.DELIVERED }),
      );
      expect(result.status).toBe(OrderStatus.DELIVERED);
    });

    it('deve lançar NotFoundException ao atualizar status de pedido inexistente', async () => {
      // Arrange
      mockOrderRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateStatus(99, OrderStatus.DELIVERED)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deve persistir o campo notes nos itens do pedido', async () => {
      // Arrange
      const dto = {
        customerId: 1,
        isDiscountApplied: false,
        items: [
          {
            pizzaId: 1,
            quantity: 1,
            unitPrice: 39.9,
            notes: 'Metade Calabresa / Metade Frango',
          },
        ],
      };
      const pedidoCriado = { id: 2, ...mockOrder };
      mockOrderRepository.create.mockReturnValue(pedidoCriado);
      mockOrderRepository.save.mockResolvedValue(pedidoCriado);
      mockOrderRepository.findOne.mockResolvedValue(pedidoCriado);

      // Act
      await service.create(dto);

      // Assert
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ notes: 'Metade Calabresa / Metade Frango' }),
          ]),
        }),
      );
    });

    it('deve criar pedido sem desconto quando isDiscountApplied é false', async () => {
      // Arrange
      const dto = {
        customerId: 1,
        isDiscountApplied: false,
        items: [{ pizzaId: 1, quantity: 2, unitPrice: 35.0, notes: null }],
      };
      const pedidoCriado = { id: 3, ...mockOrder, totalValue: 70, discountApplied: 0, finalValue: 70 };
      mockOrderRepository.create.mockReturnValue(pedidoCriado);
      mockOrderRepository.save.mockResolvedValue(pedidoCriado);
      mockOrderRepository.findOne.mockResolvedValue(pedidoCriado);

      // Act
      await service.create(dto);

      // Assert
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discountApplied: 0,
          isDiscountApplied: false,
        }),
      );
    });
  });

  describe('checkDiscount', () => {
    it('deve delegar para o LoyaltyService e retornar eligible e completedOrders', async () => {
      // Arrange
      mockLoyaltyService.getCompletedOrderCount.mockResolvedValue(2);
      mockLoyaltyService.hasDiscount.mockResolvedValue(true);

      // Act
      const result = await service.checkDiscount(1);

      // Assert
      expect(result).toEqual({ eligible: true, completedOrders: 2 });
      expect(mockLoyaltyService.getCompletedOrderCount).toHaveBeenCalledWith(1);
      expect(mockLoyaltyService.hasDiscount).toHaveBeenCalledWith(1);
    });
  });

  describe('remove', () => {
    it('deve chamar repository.remove com o pedido encontrado', async () => {
      // Arrange
      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.remove.mockResolvedValue(undefined);

      // Act
      await service.remove(1);

      // Assert
      expect(mockOrderRepository.remove).toHaveBeenCalledWith(mockOrder);
    });
  });
});
