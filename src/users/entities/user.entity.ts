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
import { Booking } from '../../bookings/dto/bookings.entity'; 
import { Profile } from '../../profile/entities/profile.entity';// Corregido el import

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

  @Column({ type: 'text', nullable: true })
  profileImageUrl: string;

  @Column({ type: 'text', nullable: true })
  profileImagePublicId: string;

  // --- Nuevo Campo para Perfil Detallado ---
  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: true, // Permite guardar/actualizar el perfil junto con el usuario
    eager: true,   // Carga automáticamente el perfil al buscar un usuario
  })
  @JoinColumn() // Especifica que esta es la entidad dueña de la relación
  profile: Profile;
  // --- Relaciones ---
  @OneToOne(() => Studio, (studio) => studio.owner)
  studio: Studio;

  @OneToMany(() => Booking, (booking) => booking.musician)
  bookings: Booking[];

}
