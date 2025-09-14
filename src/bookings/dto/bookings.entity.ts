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
import { BookingAction } from '../enum/booking-action.enum';

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

  // NEW: Control de reprogramación (ya tenías hasRescheduled)
  // ===========================
  @Column({ default: false })
  hasRescheduled: boolean; // NEW: indica si ya se reprogramó esta reserva

  // ===========================
  // NEW: fecha de reprogramación (registro)
  // ===========================
  @Column({ type: 'timestamp', nullable: true })
  reprogramDate?: Date; // NEW

  // ===========================
  // NEW: Control de cancelaciones por día (ya tenías canceledAtDate pero lo marco)
  // ===========================
  @Column({ type: 'date', nullable: true })
  canceledAtDate: Date | null; // NEW (si ya lo tenías, igual lo dejo marcado)

  // ===========================
  // NEW: Guardar acción específica del músico (separado de BookingStatus)
  // ===========================
  @Column({
    type: 'enum',
    enum: BookingAction,
    default: BookingAction.ACTIVE,
  })
  action: BookingAction; // NEW: ACTIVE / CANCELED / REPROGRAMMED
}
