import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/dto/bookings.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  // Quién envió el mensaje
  @ManyToOne(() => User, { eager: true }) // eager para cargar el usuario automáticamente
  sender: User;

  // A qué reserva (sala de chat) pertenece
  @ManyToOne(() => Booking)
  booking: Booking;
}