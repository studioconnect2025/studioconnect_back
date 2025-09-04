import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Studio } from 'src/studios/entities/studio.entity';
import { User } from 'src/users/entities/user.entity';

export enum BookingStatus {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  RECHAZADA = 'RECHAZADA',
}

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Studio, (studio) => studio.bookings, { nullable: false })
  studio: Studio;

  @ManyToOne(() => User, (user) => user.bookings, { nullable: false })
  musician: User;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDIENTE,
  })
  status: BookingStatus;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;
}
