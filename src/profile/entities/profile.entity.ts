import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text' })
  apellido: string;

  @Column({ type: 'text', nullable: true })
  numeroDeTelefono?: string;
  
  @Column({ type: 'text', nullable: true })
  ciudad?: string;

  @Column({ type: 'text', nullable: true })
  provincia?: string;

  @Column({ type: 'text', nullable: true })
  calle?: string;

  @Column({ type: 'text', nullable: true })
  codigoPostal?: string;

  // Relación inversa para que se pueda acceder al usuario desde el perfil si es necesario
  @OneToOne(() => User, (user) => user.profile)
  user: User;
}