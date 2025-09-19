import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PqrStatus {
  OPEN = 'ABIERTO',
  IN_PROGRESS = 'EN_PROGRESO',
  RESOLVED = 'RESUELTO',
  CLOSED = 'CERRADO',
}

export enum PqrType {
  COMPLAINT = 'QUEJA', // Queja sobre un usuario, estudio, etc.
  CLAIM = 'RECLAMO', // Reclamo sobre un pago, una reserva.
  SUGGESTION = 'SUGERENCIA', // Sugerencia general.
}


@Entity('pqrs')
export class Pqr {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subject: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: PqrType,
  })
  type: PqrType;

  @Column({
    type: 'enum',
    enum: PqrStatus,
    default: PqrStatus.OPEN,
  })
  status: PqrStatus;

  @CreateDateColumn()
  createdAt: Date;

  // Quién crea la PQR
  @ManyToOne(() => User)
  createdBy: User;

  // A quién se reporta (opcional)
  @ManyToOne(() => User, { nullable: true })
  reportedUser?: User;
}