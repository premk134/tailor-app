import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, AuthProvider, UserRole } from '../../database/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    phone: '1234567890',
    role: UserRole.CUSTOMER,
    authProvider: AuthProvider.LOCAL,
    isActive: true,
    emailVerified: false,
    phoneVerified: false,
    validatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      name: 'New User',
      phone: '9876543210',
      role: UserRole.CUSTOMER,
    };

    it('should create a new user and return tokens', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);

      configService.get.mockImplementation((key: string) => {
        const config = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key as keyof typeof config];
      });

      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.signup(signupDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: signupDto.email }, { phone: signupDto.phone }],
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        ...signupDto,
        authProvider: AuthProvider.LOCAL,
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if phone already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser as User);

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
      expect(userRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user with valid credentials', async () => {
      const userWithPassword = {
        ...mockUser,
        password: 'hashed-password',
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      userRepository.findOne.mockResolvedValue(userWithPassword as User);
      userRepository.save.mockResolvedValue(userWithPassword as User);

      configService.get.mockImplementation((key: string) => {
        const config = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key as keyof typeof config];
      });

      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email, authProvider: AuthProvider.LOCAL },
        select: ['id', 'email', 'password', 'role', 'name', 'isActive'],
      });
      expect(userWithPassword.validatePassword).toHaveBeenCalledWith(loginDto.password);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(userRepository.findOne).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const userWithPassword = {
        ...mockUser,
        password: 'hashed-password',
        validatePassword: jest.fn().mockResolvedValue(false),
      };

      userRepository.findOne.mockResolvedValue(userWithPassword as User);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(userWithPassword.validatePassword).toHaveBeenCalledWith(loginDto.password);
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: false,
      };

      userRepository.findOne.mockResolvedValue(inactiveUser as User);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should update lastLoginAt on successful login', async () => {
      const userWithPassword = {
        ...mockUser,
        password: 'hashed-password',
        validatePassword: jest.fn().mockResolvedValue(true),
        lastLoginAt: null,
      };

      userRepository.findOne.mockResolvedValue(userWithPassword as User);
      userRepository.save.mockResolvedValue(userWithPassword as User);

      configService.get.mockImplementation((key: string) => {
        const config = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key as keyof typeof config];
      });

      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');

      await service.login(loginDto);

      expect(userRepository.save).toHaveBeenCalled();
      expect(userWithPassword.lastLoginAt).toBeDefined();
    });
  });

  describe('requestOtp', () => {
    it('should return success message in development', async () => {
      configService.get.mockReturnValue('development');

      const result = await service.requestOtp('1234567890');

      expect(result).toHaveProperty('message', 'OTP sent successfully');
      expect(result).toHaveProperty('otp', '123456');
    });

    it('should not return OTP in production', async () => {
      configService.get.mockReturnValue('production');

      const result = await service.requestOtp('1234567890');

      expect(result).toHaveProperty('message', 'OTP sent successfully');
      expect(result).not.toHaveProperty('otp');
    });
  });

  describe('verifyOtp', () => {
    it('should create new user with valid OTP in development', async () => {
      const phone = '1234567890';
      const otp = '123456';

      configService.get.mockReturnValue('development');
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({
        ...mockUser,
        phone,
        phoneVerified: true,
      } as User);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        phone,
        phoneVerified: true,
      } as User);

      configService.get.mockImplementation((key: string) => {
        const config = {
          NODE_ENV: 'development',
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key as keyof typeof config];
      });

      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.verifyOtp(phone, otp);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { phone } });
      expect(userRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('should login existing user with valid OTP', async () => {
      const phone = '1234567890';
      const otp = '123456';

      configService.get.mockImplementation((key: string) => {
        const config = {
          NODE_ENV: 'development',
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key as keyof typeof config];
      });

      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        phone,
        phoneVerified: false,
      } as User);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        phone,
        phoneVerified: true,
      } as User);

      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.verifyOtp(phone, otp);

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw BadRequestException with invalid OTP', async () => {
      configService.get.mockReturnValue('development');

      await expect(service.verifyOtp('1234567890', 'wrong-otp')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens for valid user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      userRepository.findOne.mockResolvedValue(mockUser as User);

      configService.get.mockImplementation((key: string) => {
        const config = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key as keyof typeof config];
      });

      jwtService.signAsync.mockResolvedValueOnce('new-access-token');
      jwtService.signAsync.mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshToken(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as User);

      await expect(service.refreshToken('some-id')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateTokens (private method tested indirectly)', () => {
    it('should generate both access and refresh tokens', async () => {
      const signupDto: SignupDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        phone: '9876543210',
        role: UserRole.CUSTOMER,
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as User);
      userRepository.save.mockResolvedValue(mockUser as User);

      configService.get.mockImplementation((key: string) => {
        const config = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key as keyof typeof config];
      });

      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');

      await service.signup(signupDto);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        }),
        expect.objectContaining({
          secret: 'test-secret',
          expiresIn: '15m',
        }),
      );
    });
  });

  describe('sanitizeUser (private method tested indirectly)', () => {
    it('should remove password from user object', async () => {
      const signupDto: SignupDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        phone: '9876543210',
        role: UserRole.CUSTOMER,
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({
        ...mockUser,
        password: 'hashed-password',
      } as User);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        password: 'hashed-password',
      } as User);

      configService.get.mockImplementation((key: string) => {
        const config = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key as keyof typeof config];
      });

      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.signup(signupDto);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('id');
    });
  });
});
