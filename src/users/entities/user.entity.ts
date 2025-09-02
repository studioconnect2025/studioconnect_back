import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserRole } from '../../auth/enum/roles.enum';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  passwordHash: string; 

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MUSICIAN, 
  })
  role: UserRole;
}