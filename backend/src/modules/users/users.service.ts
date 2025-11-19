import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);
    const { password, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, updateData: Partial<User>) {
    const user = await this.findById(userId);

    // Don't allow updating sensitive fields
    delete updateData.password;
    delete updateData.role;
    delete updateData.email;

    Object.assign(user, updateData);
    await this.userRepository.save(user);

    const { password, ...profile } = user;
    return profile;
  }

  async updatePreferences(userId: string, preferences: any) {
    const user = await this.findById(userId);
    user.preferences = { ...user.preferences, ...preferences };
    await this.userRepository.save(user);
    return user.preferences;
  }
}
