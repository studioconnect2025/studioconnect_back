import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Pqr } from './pqr.entity';

@Entity('pqr_responses')
export class PqrResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  // El admin que respondió
  @ManyToOne(() => User)
  author: User;

  // La PQR a la que pertenece esta respuesta
  @ManyToOne(() => Pqr, (pqr) => pqr.responses)
  pqr: Pqr;
}