import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatMessage } from './entities/chat-message.entity';
import { AuthModule } from 'src/auth/auth.module'; // Importamos AuthModule
import { BookingsModule } from 'src/bookings/bookings.module'; // Importamos BookingsModule

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    AuthModule, // Para poder inyectar AuthService en el Guard
    BookingsModule, // Para poder inyectar BookingsService
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}