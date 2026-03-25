import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';

describe('CustomersService', () => {
  let service: CustomersService;
  let mockCustomerRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const mockCustomer: Customer = {
    id: 1,
    name: 'João Silva',
    cpf: '52998224725',
    phone: '11999999999',
    address: 'Rua das Flores, 123',
    email: 'joao@email.com',
    createdAt: new Date(),
    orders: [],
  };

  beforeEach(async () => {
    const mockQB = {
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockCustomer]),
    };

    mockCustomerRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQB),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deve retornar um array de clientes com totalOrders mapeado', async () => {
      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual([mockCustomer]);
      expect(mockCustomerRepository.createQueryBuilder).toHaveBeenCalledWith('customer');
    });
  });

  describe('findById', () => {
    it('deve retornar o cliente quando o ID existe', async () => {
      // Arrange
      mockCustomerRepository.findOneBy.mockResolvedValue(mockCustomer);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toBe(mockCustomer);
      expect(mockCustomerRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('deve lançar NotFoundException quando o ID não existe', async () => {
      // Arrange
      mockCustomerRepository.findOneBy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve lançar BadRequestException para CPF inválido', async () => {
      // Arrange
      const dto = { name: 'Teste', cpf: '00000000000', phone: '11999999999', address: 'Rua A' };

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ConflictException para CPF duplicado', async () => {
      // Arrange
      const dto = { name: 'João', cpf: '52998224725', phone: '11999999999', address: 'Rua A' };
      mockCustomerRepository.findOneBy.mockResolvedValue(mockCustomer);

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('deve alterar apenas o campo name quando somente ele é enviado', async () => {
      // Arrange
      const clienteExistente = { ...mockCustomer };
      mockCustomerRepository.findOneBy.mockResolvedValue(clienteExistente);
      mockCustomerRepository.save.mockResolvedValue({ ...clienteExistente, name: 'Novo Nome' });

      // Act
      await service.update(1, { name: 'Novo Nome' });

      // Assert
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Novo Nome',
          cpf: mockCustomer.cpf,
          phone: mockCustomer.phone,
        }),
      );
    });

    it('deve lançar NotFoundException ao atualizar ID inexistente', async () => {
      // Arrange
      mockCustomerRepository.findOneBy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(99, { name: 'Teste' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve chamar repository.remove com o cliente encontrado', async () => {
      // Arrange
      mockCustomerRepository.findOneBy.mockResolvedValue(mockCustomer);
      mockCustomerRepository.remove.mockResolvedValue(undefined);

      // Act
      await service.remove(1);

      // Assert
      expect(mockCustomerRepository.remove).toHaveBeenCalledWith(mockCustomer);
    });

    it('deve lançar NotFoundException ao remover ID inexistente', async () => {
      // Arrange
      mockCustomerRepository.findOneBy.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
