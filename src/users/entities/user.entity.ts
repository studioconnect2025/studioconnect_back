import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../auth/enum/roles.enum';
import { Studio } from '../../studios/entities/studio.entity';
import { Booking } from 'src/bookings/dto/bookings.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  passwordHash: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDIO_OWNER,
  })
  role: UserRole;

  @OneToOne(() => Studio, (studio) => studio.owner)
  studio: Studio;

  @OneToMany(() => Booking, (booking) => booking.musician)
  bookings: Booking[];
}
