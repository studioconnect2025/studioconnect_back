import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Studio } from 'src/studios/entities/studio.entity';

@Entity()
export class Instrument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  name: string;

  @Column({ nullable: false, type: 'text' })
  description: string;

  @Column({ default: true })
  available: boolean;

  @ManyToOne(() => Studio, (studio) => studio.instruments, {
    onDelete: 'CASCADE',
  })
  studio: Studio;
}
