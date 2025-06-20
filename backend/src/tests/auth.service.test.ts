import { AuthService } from '@/services/auth.service';
import { prisma } from '@/config/database';
import { hashPassword } from '@/utils/crypto';
import { Role } from '@prisma/client';

// Mock do Prisma
jest.mock('@/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    client: {
      create: jest.fn(),
    },
  },
}));

// Mock dos utilitários
jest.mock('@/utils/crypto', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  validatePasswordStrength: jest.fn(),
  generateResetToken: jest.fn(() => 'mock-reset-token'),
  hashResetToken: jest.fn(() => 'mock-hashed-token'),
}));

jest.mock('@/utils/jwt', () => ({
  generateAccessToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  getTokenExpirationTime: jest.fn(() => 3600),
  verifyRefreshToken: jest.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      // Arrange
      const registerData = {
        name: 'Teste Usuario',
        email: 'teste@exemplo.com',
        password: 'MinhaSenh@123',
      };

      const mockUser = {
        id: 'user-id',
        name: 'Teste Usuario',
        email: 'teste@exemplo.com',
        password: 'hashed-password',
        role: Role.CLIENT,
        phone: null,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        barberProfile: null,
        barbershop: null,
      };

      // Mock das funções
      (prisma.user.findUnique as any).mockResolvedValue(null); // Email não existe
      (hashPassword as any).mockResolvedValue('hashed-password');
      (prisma.user.create as any).mockResolvedValue(mockUser);
      (prisma.client.create as any).mockResolvedValue({});

      // Mock da validação de senha
      const { validatePasswordStrength } = await import('@/utils/crypto');
      (validatePasswordStrength as any).mockReturnValue({
        isValid: true,
        errors: [],
        score: 5,
      });

      // Act
      const result = await AuthService.register(registerData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(registerData.email);
      expect(result.user.name).toBe(registerData.name);
      expect(result.user.role).toBe(Role.CLIENT);

      // Verificar se as funções foram chamadas
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });
      expect(hashPassword).toHaveBeenCalledWith(registerData.password);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.client.create).toHaveBeenCalled();
    });

    it('deve falhar se o email já existir', async () => {
      // Arrange
      const registerData = {
        name: 'Teste Usuario',
        email: 'teste@exemplo.com',
        password: 'MinhaSenh@123',
      };

      const existingUser = {
        id: 'existing-user-id',
        email: 'teste@exemplo.com',
      };

      (prisma.user.findUnique as any).mockResolvedValue(existingUser);

      // Act & Assert
      await expect(AuthService.register(registerData)).rejects.toThrow('Email já está em uso');
    });

    it('deve falhar se a senha for fraca', async () => {
      // Arrange
      const registerData = {
        name: 'Teste Usuario',
        email: 'teste@exemplo.com',
        password: '123',
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);

      const { validatePasswordStrength } = await import('@/utils/crypto');
      (validatePasswordStrength as any).mockReturnValue({
        isValid: false,
        errors: ['Senha muito fraca'],
        score: 1,
      });

      // Act & Assert
      await expect(AuthService.register(registerData)).rejects.toThrow(
        'Senha fraca: Senha muito fraca'
      );
    });
  });

  describe('login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      // Arrange
      const loginData = {
        email: 'teste@exemplo.com',
        password: 'MinhaSenh@123',
      };

      const mockUser = {
        id: 'user-id',
        name: 'Teste Usuario',
        email: 'teste@exemplo.com',
        password: 'hashed-password',
        role: Role.CLIENT,
        phone: null,
        avatar: null,
        barberProfile: null,
        barbershop: null,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const { verifyPassword } = await import('@/utils/crypto');
      (verifyPassword as any).mockResolvedValue(true);

      // Act
      const result = await AuthService.login(loginData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginData.email);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
        include: {
          barberProfile: {
            select: {
              id: true,
              barbershopId: true,
              isActive: true,
            },
          },
          barbershop: {
            select: {
              id: true,
            },
          },
        },
      });
      expect(verifyPassword).toHaveBeenCalledWith(loginData.password, mockUser.password);
    });

    it('deve falhar com email inexistente', async () => {
      // Arrange
      const loginData = {
        email: 'inexistente@exemplo.com',
        password: 'MinhaSenh@123',
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(AuthService.login(loginData)).rejects.toThrow('Credenciais inválidas');
    });

    it('deve falhar com senha incorreta', async () => {
      // Arrange
      const loginData = {
        email: 'teste@exemplo.com',
        password: 'SenhaErrada',
      };

      const mockUser = {
        id: 'user-id',
        email: 'teste@exemplo.com',
        password: 'hashed-password',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const { verifyPassword } = await import('@/utils/crypto');
      (verifyPassword as any).mockResolvedValue(false);

      // Act & Assert
      await expect(AuthService.login(loginData)).rejects.toThrow('Credenciais inválidas');
    });

    it('deve falhar se barbeiro estiver desativado', async () => {
      // Arrange
      const loginData = {
        email: 'barbeiro@exemplo.com',
        password: 'MinhaSenh@123',
      };

      const mockUser = {
        id: 'user-id',
        email: 'barbeiro@exemplo.com',
        password: 'hashed-password',
        role: Role.BARBER,
        barberProfile: {
          id: 'barber-id',
          barbershopId: 'barbershop-id',
          isActive: false,
        },
        barbershop: null,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const { verifyPassword } = await import('@/utils/crypto');
      (verifyPassword as any).mockResolvedValue(true);

      // Act & Assert
      await expect(AuthService.login(loginData)).rejects.toThrow('Conta de barbeiro desativada');
    });
  });

  describe('refreshToken', () => {
    it('deve renovar token com sucesso', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const mockPayload = {
        userId: 'user-id',
        tokenVersion: 1,
        iat: 1234567890,
        exp: 1234567890,
      };

      const mockUser = {
        id: 'user-id',
        name: 'Teste Usuario',
        email: 'teste@exemplo.com',
        role: Role.CLIENT,
        phone: null,
        avatar: null,
        barberProfile: null,
        barbershop: null,
      };

      const { verifyRefreshToken } = await import('@/utils/jwt');
      (verifyRefreshToken as any).mockReturnValue(mockPayload);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.refreshToken(refreshToken);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe(mockUser.id);
      expect(verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
    });

    it('deve falhar se usuário não existir', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const mockPayload = {
        userId: 'non-existent-user',
        tokenVersion: 1,
        iat: 1234567890,
        exp: 1234567890,
      };

      const { verifyRefreshToken } = await import('@/utils/jwt');
      (verifyRefreshToken as any).mockReturnValue(mockPayload);
      (prisma.user.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(AuthService.refreshToken(refreshToken)).rejects.toThrow(
        'Usuário não encontrado'
      );
    });
  });

  describe('forgotPassword', () => {
    it('deve processar solicitação de reset para email existente', async () => {
      // Arrange
      const forgotData = { email: 'teste@exemplo.com' };
      const mockUser = {
        id: 'user-id',
        email: 'teste@exemplo.com',
        name: 'Teste Usuario',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      // Act
      await AuthService.forgotPassword(forgotData);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: forgotData.email },
      });
    });

    it('deve processar silenciosamente para email inexistente', async () => {
      // Arrange
      const forgotData = { email: 'inexistente@exemplo.com' };

      (prisma.user.findUnique as any).mockResolvedValue(null);

      // Act & Assert - não deve lançar erro
      await expect(AuthService.forgotPassword(forgotData)).resolves.toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('deve alterar senha com sucesso', async () => {
      // Arrange
      const userId = 'user-id';
      const changeData = {
        currentPassword: 'SenhaAtual123',
        newPassword: 'NovaSenha123',
      };

      const mockUser = {
        id: userId,
        email: 'teste@exemplo.com',
        password: 'hashed-current-password',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const { verifyPassword, validatePasswordStrength, hashPassword } = await import(
        '@/utils/crypto'
      );
      (verifyPassword as any).mockResolvedValue(true);
      (validatePasswordStrength as any).mockReturnValue({
        isValid: true,
        errors: [],
        score: 5,
      });
      (hashPassword as any).mockResolvedValue('new-hashed-password');
      (prisma.user.update as any).mockResolvedValue(mockUser);

      // Act
      await AuthService.changePassword(userId, changeData);

      // Assert
      expect(verifyPassword).toHaveBeenCalledWith(changeData.currentPassword, mockUser.password);
      expect(validatePasswordStrength).toHaveBeenCalledWith(changeData.newPassword);
      expect(hashPassword).toHaveBeenCalledWith(changeData.newPassword);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'new-hashed-password' },
      });
    });

    it('deve falhar se senha atual estiver incorreta', async () => {
      // Arrange
      const userId = 'user-id';
      const changeData = {
        currentPassword: 'SenhaErrada',
        newPassword: 'NovaSenha123',
      };

      const mockUser = {
        id: userId,
        password: 'hashed-current-password',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const { verifyPassword } = await import('@/utils/crypto');
      (verifyPassword as any).mockResolvedValue(false);

      // Act & Assert
      await expect(AuthService.changePassword(userId, changeData)).rejects.toThrow(
        'Senha atual incorreta'
      );
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar perfil com sucesso', async () => {
      // Arrange
      const userId = 'user-id';
      const updateData = {
        name: 'Novo Nome',
        phone: '11999999999',
        avatar: 'nova-foto.jpg',
      };

      const mockUpdatedUser = {
        id: userId,
        name: 'Novo Nome',
        email: 'teste@exemplo.com',
        role: Role.CLIENT,
        phone: '11999999999',
        avatar: 'nova-foto.jpg',
        barberProfile: null,
        barbershop: null,
      };

      (prisma.user.update as any).mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await AuthService.updateProfile(userId, updateData);

      // Assert
      expect(result).toHaveProperty('id', userId);
      expect(result).toHaveProperty('name', updateData.name);
      expect(result).toHaveProperty('phone', updateData.phone);
      expect(result).toHaveProperty('avatar', updateData.avatar);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          name: updateData.name,
          phone: updateData.phone,
          avatar: updateData.avatar,
        },
        include: {
          barberProfile: {
            select: {
              id: true,
              barbershopId: true,
            },
          },
          barbershop: {
            select: {
              id: true,
            },
          },
        },
      });
    });
  });
});
