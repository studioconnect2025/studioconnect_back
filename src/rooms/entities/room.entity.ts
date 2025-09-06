import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinTable, ManyToMany } from 'typeorm';
import { Studio } from 'src/studios/entities/studio.entity';
import { Instruments } from 'src/instrumentos/entities/instrumento.entity';

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
  availability: any; // { day: 'Lunes', from: '09:00', to: '22:00' }

  @ManyToOne(() => Studio, (studio) => studio.rooms, { onDelete: 'CASCADE' })
  studio: Studio;
  
  @ManyToMany(() => Instruments, { eager: true })
  @JoinTable()
  instruments: Instruments[];
}
