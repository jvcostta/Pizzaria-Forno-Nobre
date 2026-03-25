import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PizzasService } from './pizzas.service';
import { Pizza } from './entities/pizza.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';

describe('PizzasService', () => {
  let service: PizzasService;
  let mockPizzaRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
    remove: jest.Mock;
  };
  let mockOrderItemRepository: {
    createQueryBuilder: jest.Mock;
  };

  const mockPizzaAtiva: Pizza = {
    id: 1,
    flavorName: 'Calabresa',
    description: 'Calabresa com cebola',
    price: 39.9,
    category: 'Salgada',
    isActive: true,
    createdAt: new Date(),
  };

  const mockPizzaInativa: Pizza = {
    id: 2,
    flavorName: 'Frango Especial',
    description: 'Fora de estação',
    price: 42.0,
    category: 'Especial',
    isActive: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockQB = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    mockPizzaRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
    };

    mockOrderItemRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQB),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PizzasService,
        { provide: getRepositoryToken(Pizza), useValue: mockPizzaRepository },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepository },
      ],
    }).compile();

    service = module.get<PizzasService>(PizzasService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deve filtrar apenas pizzas ativas quando activeOnly=true (padrão)', async () => {
      // Arrange
      mockPizzaRepository.find.mockResolvedValue([mockPizzaAtiva]);

      // Act
      const result = await service.findAll(true);

      // Assert
      expect(mockPizzaRepository.find).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(result).toEqual([mockPizzaAtiva]);
    });

    it('deve retornar todas as pizzas quando activeOnly=false', async () => {
      // Arrange
      mockPizzaRepository.find.mockResolvedValue([mockPizzaAtiva, mockPizzaInativa]);

      // Act
      const result = await service.findAll(false);

      // Assert
      expect(mockPizzaRepository.find).toHaveBeenCalledWith();
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('deve retornar a pizza quando o ID existe', async () => {
      // Arrange
      mockPizzaRepository.findOneBy.mockResolvedValue(mockPizzaAtiva);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toBe(mockPizzaAtiva);
    });

    it('deve lançar NotFoundException quando o ID não existe', async () => {
      // Arrange
      mockPizzaRepository.findOneBy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findTopSellers', () => {
    it('deve retornar o ranking convertendo os valores numéricos corretamente', async () => {
      // Arrange
      const rawRows = [
        { pizzaId: '1', flavorName: 'Calabresa', totalSold: '25' },
        { pizzaId: '2', flavorName: 'Frango', totalSold: '18' },
      ];
      mockOrderItemRepository
        .createQueryBuilder()
        .getRawMany.mockResolvedValue(rawRows);

      // Act
      const result = await service.findTopSellers(2);

      // Assert
      expect(result[0].totalSold).toBe(25);
      expect(result[1].totalSold).toBe(18);
      expect(result[0].pizzaId).toBe(1);
    });

    it('deve retornar array vazio quando não há vendas', async () => {
      // Arrange
      mockOrderItemRepository.createQueryBuilder().getRawMany.mockResolvedValue([]);

      // Act
      const result = await service.findTopSellers();

      // Assert
      expect(result).toEqual([]);
    });

    it('deve tratar totalSold nulo como zero', async () => {
      // Arrange
      const rawRows = [{ pizzaId: '3', flavorName: 'Doce de Leite', totalSold: null }];
      mockOrderItemRepository.createQueryBuilder().getRawMany.mockResolvedValue(rawRows);

      // Act
      const result = await service.findTopSellers();

      // Assert
      expect(result[0].totalSold).toBe(0);
    });
  });
});
