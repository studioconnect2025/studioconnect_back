import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  ManyToMany,
} from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Booking } from 'src/bookings/dto/bookings.entity';

@Entity({
  name: 'INSTRUMENTOS',
})
@Unique(['name', 'room'])
export class Instruments {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  name: string;

  @Column({
    nullable: false,
    type: 'text',
  })
  description: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string): number => parseFloat(value),
    },
  })
  price: number;

  @Column({ default: true })
  available: boolean;

  @ManyToOne(() => Category, (category) => category.instruments, {
    eager: false,
  })
  category: Category;

  @ManyToOne(() => Room, (room) => room.instruments, {
    onDelete: 'CASCADE',
  })
  room: Room;

  @ManyToMany(() => Booking, (booking) => booking.instruments)
  bookings: Booking[];
}
