import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AuthProvider } from '../../database/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto) {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email: signupDto.email }, { phone: signupDto.phone }],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Create user
    const user = this.userRepository.create({
      ...signupDto,
      authProvider: AuthProvider.LOCAL,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user with password
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email, authProvider: AuthProvider.LOCAL },
      select: ['id', 'email', 'password', 'role', 'name', 'isActive'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async requestOtp(phone: string) {
    // In production, integrate with Twilio or similar service
    // For now, we'll just return a success message
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // TODO: Send OTP via Twilio
    // await this.twilioService.sendOtp(phone, otp);

    // Store OTP in cache/database with expiry

    return {
      message: 'OTP sent successfully',
      // In development, return the OTP (remove in production)
      ...(this.configService.get('NODE_ENV') === 'development' && {
        otp: '123456',
      }),
    };
  }

  async verifyOtp(phone: string, otp: string) {
    // TODO: Verify OTP from cache/database
    // For demo purposes, accept any 6-digit OTP in development
    if (this.configService.get('NODE_ENV') === 'development' && otp === '123456') {
      // Find or create user
      let user = await this.userRepository.findOne({ where: { phone } });

      if (!user) {
        user = this.userRepository.create({
          phone,
          phoneVerified: true,
          authProvider: AuthProvider.LOCAL,
        });
        await this.userRepository.save(user);
      } else {
        user.phoneVerified = true;
        user.lastLoginAt = new Date();
        await this.userRepository.save(user);
      }

      const tokens = await this.generateTokens(user);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    }

    throw new BadRequestException('Invalid OTP');
  }

  async refreshToken(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser(user: User) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
