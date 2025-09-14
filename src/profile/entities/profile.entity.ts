import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity('profile') 
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (u) => u.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) 
  user: User;

  @Column('uuid', { unique: true })
  userId: string;

  @Column({ nullable: true }) nombre?: string;
  @Column({ nullable: true }) apellido?: string;
  @Column({ nullable: true }) numeroDeTelefono?: string;
  @Column({ nullable: true }) ciudad?: string;
  @Column({ nullable: true }) provincia?: string;
  @Column({ nullable: true }) calle?: string;
  @Column({ nullable: true }) codigoPostal?: string;
}
