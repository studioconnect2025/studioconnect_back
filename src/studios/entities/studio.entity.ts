import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { StudioStatus } from '../enum/studio-status.enum';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Entity('studios')
export class Studio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column()
  city: string;

  @Column()
  province: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'text' })
  description: string;

  @Column('text', { array: true, nullable: true })
  photos?: string[];

  @Column('text', { array: true, nullable: true })
  availableEquipment?: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dailyRate?: number;

  @Column({ nullable: true })
  openingTime?: string;

  @Column({ nullable: true })
  closingTime?: string;

  @OneToOne(() => User, (user) => user.studio, { eager: true })
  @JoinColumn()
  owner: User;

  @OneToMany(() => Instruments, (instrument) => instrument.studio, {
    cascade: true,
  })
  instruments: Instruments[];

  // --- LÍNEA AÑADIDA ---
  @OneToMany(() => Booking, (booking) => booking.studio)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: StudioStatus,
    default: StudioStatus.PENDING,
  })
  status: StudioStatus;

  @OneToMany(() => Room, (room) => room.studio, { cascade: true })
  rooms: Room[];
}
