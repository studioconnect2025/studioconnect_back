import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Studio } from 'src/studios/entities/studio.entity';

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

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Studio, (studio) => studio.rooms, { onDelete: 'CASCADE' })
  studio: Studio;
}
