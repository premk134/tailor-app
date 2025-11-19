import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../database/entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async create(fromId: string, toId: string, text: string, orderId?: string) {
    const message = this.messageRepository.create({
      fromId,
      toId,
      text,
      orderId,
    });
    return this.messageRepository.save(message);
  }

  async findByOrder(orderId: string) {
    return this.messageRepository.find({
      where: { orderId },
      relations: ['from', 'to'],
      order: { createdAt: 'ASC' },
    });
  }

  async markAsRead(messageId: string) {
    await this.messageRepository.update(messageId, {
      isRead: true,
      readAt: new Date(),
    });
  }
}
