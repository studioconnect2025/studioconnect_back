import { Instruments } from 'src/instrumentos/entities/instrumento.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({
  name: 'CATEGORIES',
})
export class Category {
  @ApiProperty({
    description: 'ID único de la categoría',
    example: 'a12f9b8c-7d23-4c6b-8d2a-5e7f1c1d9a0b',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre único de la categoría',
    example: 'Guitarras',
  })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  name: string;

  @ApiProperty({
    description: 'Instrumentos que pertenecen a esta categoría',
    type: () => [Instruments], 
    required: false,
  })
  @OneToMany(() => Instruments, (instruments) => instruments.category)
  instruments: Instruments[];
}

