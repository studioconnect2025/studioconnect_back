import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../../auth/enum/roles.enum';
import { Studio } from '../../studios/entities/studio.entity';
import { Booking } from '../../bookings/dto/bookings.entity'; // Corregido el import
import { Profile } from '../../profile/entities/profile.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Campos de Autenticación y Rol ---
  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: false, // Es mejor que el rol siempre sea obligatorio
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  // -- relacion con profile --- NO TOCAR!!!!
 @OneToOne(() => Profile, (p) => p.user, { eager: true })
  profile: Profile;

  // --- Relaciones ---
  @OneToOne(() => Studio, (studio) => studio.owner)
  studio: Studio;

  @OneToMany(() => Booking, (booking) => booking.musician)
  bookings: Booking[];
}
