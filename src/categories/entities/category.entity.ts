import { Instruments } from 'src/instrumentos/entities/instrumento.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'CATEGORIES',
})
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  name: string;

  @OneToMany(() => Instruments, (instruments) => instruments.category)
  instruments: Instruments;
}
