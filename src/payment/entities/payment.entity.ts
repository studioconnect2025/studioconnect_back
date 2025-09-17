import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from 'src/bookings/dto/bookings.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking, { nullable: true, eager: true })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking | null;

  @Column()
  stripePaymentIntentId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ length: 10, default: 'usd' })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;
}
