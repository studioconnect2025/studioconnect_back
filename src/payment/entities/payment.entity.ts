import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { Membership } from 'src/membership/entities/membership.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking, { nullable: true, eager: true })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking | null;

  // NUEVA LÍNEA: Columna para la clave foránea de Membership
  @Column({ nullable: true })
  membershipId: string;

  @ManyToOne(() => Membership, { nullable: true, eager: true })
  @JoinColumn({ name: 'membershipId' })
  membership: Membership | null;

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
