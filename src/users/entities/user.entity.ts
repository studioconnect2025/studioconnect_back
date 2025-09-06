import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';
import { UserRole } from '../../auth/enum/roles.enum';
import { Studio } from '../../studios/entities/studio.entity';

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

   @OneToOne(() => Studio, (studio) => studio.owner)
  studio: Studio;
  bookings: any;
}
