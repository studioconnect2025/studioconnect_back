import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Studio } from 'src/studios/entities/studio.entity';
import { User } from 'src/users/entities/user.entity';
import { BookingStatus } from '../enum/enums-bookings';
import { Room } from 'src/rooms/entities/room.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Studio, (studio) => studio.bookings, { nullable: false })
  studio: Studio;

  @ManyToOne(() => User, (user) => user.bookings, { nullable: false })
  musician: User;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Room, (room) => room.bookings, {
    nullable: true,
    eager: true,
  })
  room: Room;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'SUCCEEDED', 'FAILED'], // NEW
    default: 'PENDING',
  })
  paymentStatus: string;

  @Column({ nullable: true })
  paymentIntentId: string;

  @Column({ default: false })
  isPaid: boolean;
}
