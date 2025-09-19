import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from 'src/users/entities/user.entity';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
  ) {}

  async createMessage(
    createMessageDto: CreateMessageDto,
    sender: User,
    booking: Booking,
  ): Promise<ChatMessage> {
    const newMessage = this.messageRepository.create({
      content: createMessageDto.content,
      sender,
      booking,
    });
    return this.messageRepository.save(newMessage);
  }

  async getMessagesForBooking(bookingId: string): Promise<ChatMessage[]> {
    return this.messageRepository.find({
      where: { booking: { id: bookingId } },
      relations: ['sender'], // Cargar la info del sender
      order: { createdAt: 'ASC' },
    });
  }
}