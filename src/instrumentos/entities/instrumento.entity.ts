import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Entity({
  name: 'INSTRUMENTOS',
})
export class Instruments {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  name: string;

  @Column({
    nullable: false,
    type: 'text',
  })
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  price: number;

  @Column({ default: true })
  available: boolean;

  @ManyToOne(() => Category, (category) => category.instruments, {
    eager: true,
  })
  category: Category;

  @ManyToOne(() => Room, (room) => room.instruments, {
    onDelete: 'CASCADE',
  })
  room: Room;
}
