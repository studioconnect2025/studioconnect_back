import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Studio } from 'src/studios/entities/studio.entity';
import { Category } from 'src/categories/entities/category.entity';

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

  @Column({
    type: 'text',
    default: 'No image',
  })
  imgUrl?: string;

  @ManyToOne(() => Category, (category) => category.Instruments, {
    eager: true,
  })
  category: Category;

  @ManyToOne(() => Studio, (studio) => studio.instruments, {
    onDelete: 'CASCADE',
  })
  studio: Studio;
}
