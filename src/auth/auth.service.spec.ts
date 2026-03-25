import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: { findByUsername: jest.Mock };
  let mockJwtService: { sign: jest.Mock };

  const mockUser: User = {
    id: 1,
    username: 'admin',
    password: '$2b$10$hashedpassword',
  };

  beforeEach(async () => {
    mockUsersService = { findByUsername: jest.fn() };
    mockJwtService = { sign: jest.fn().mockReturnValue('fake-jwt-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('deve lançar UnauthorizedException quando o username não existe', async () => {
      // Arrange
      mockUsersService.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateUser('inexistente', 'senha123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException quando a senha está incorreta', async () => {
      // Arrange
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.validateUser('admin', 'senha_errada')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve retornar o usuário quando as credenciais estão corretas', async () => {
      // Arrange
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validateUser('admin', 'admin123');

      // Assert
      expect(result).toBe(mockUser);
    });

    it('deve comparar a senha com o hash armazenado via bcrypt', async () => {
      // Arrange
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      await service.validateUser('admin', 'admin123');

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('admin123', mockUser.password);
    });
  });

  describe('login', () => {
    it('deve retornar um access_token JWT', async () => {
      // Act
      const result = await service.login(mockUser);

      // Assert
      expect(result).toEqual({ access_token: 'fake-jwt-token' });
    });

    it('deve assinar o token com o payload correto (sub e username)', async () => {
      // Act
      await service.login(mockUser);

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
    });
  });
});
