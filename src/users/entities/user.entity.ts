// src/users/entities/user.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../auth/enum/roles.enum';
import { Studio } from '../../studios/entities/studio.entity';
import { Booking } from '../../bookings/dto/bookings.entity'; // Corregido el import

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

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

  // --- Nuevo Campo para Perfil Detallado ---
  @Column({
    type: 'jsonb', // Tipo de dato para almacenar objetos JSON
    nullable: true, // Puede ser nulo si el usuario no ha completado su perfil
  })
  profile: Record<string, any>; // Almacenará nombre, apellido, perfil musical, etc.

  // --- Relaciones ---
  @OneToOne(() => Studio, (studio) => studio.owner)
  studio: Studio;

  @OneToMany(() => Booking, (booking) => booking.musician)
  bookings: Booking[];
}
