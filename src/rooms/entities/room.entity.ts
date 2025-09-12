import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Studio } from 'src/studios/entities/studio.entity';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity';
import { Booking } from 'src/bookings/dto/bookings.entity';

@Entity('ROOMS')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column()
  type: string;

  @Column()
  capacity: number;

  @Column()
  size: number;

  @Column('decimal')
  pricePerHour: number;

  @Column()
  minHours: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  features: string[];

  @Column({ type: 'text', nullable: true })
  customEquipment: string;

  @Column({ type: 'json', nullable: true })
  availability: any;

  // Campos para las imágenes de Cloudinary
  @Column('simple-array', { nullable: true })
  imageUrls: string[];

  @Column('simple-array', { nullable: true })
  imagePublicIds: string[];

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Studio, (studio) => studio.rooms, { onDelete: 'CASCADE' })
  studio: Studio;

  @OneToMany(() => Instruments, (instruments) => instruments.room, {
    onDelete: 'CASCADE',
  })
  instruments: Instruments[];

  @OneToMany(() => Booking, (booking) => booking.room)
  bookings: Booking[];
}
