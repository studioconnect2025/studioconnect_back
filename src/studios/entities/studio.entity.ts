import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { StudioStatus } from '../enum/studio-status.enum';
import { Booking } from 'src/bookings/dto/bookings.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { StudioTypeEnum } from '../enum/studio-type.enum'; // tu enum existente
import { ServicesType } from '../enum/ServicesType.enum'; // nuevo enum que crearás

@Entity('studios')
export class Studio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: StudioTypeEnum,
    default: StudioTypeEnum.GRABACION,
  })
  studioType: StudioTypeEnum;

  @Column()
  pais: string;

  @Column()
  codigoPostal: string; 

  @Column()
  city: string;

  @Column()
  province: string;

  @Column()
  address: string;

  @Column({ type: 'text' })
  description: string;

  @Column('text', { array: true, nullable: true })
  photos?: string[];

  @Column('text', { array: true, nullable: true })
  services?: ServicesType[];

  @Column({ type: 'varchar', length: 5, nullable: true })
  openingTime?: string; // formato 'HH:MM'

  @Column({ type: 'varchar', length: 5, nullable: true })
  closingTime?: string; // formato 'HH:MM'

  @Column({ nullable: true })
  comercialRegister?: string;

  @OneToOne(() => User, (user) => user.studio, { eager: true })
  @JoinColumn()
  owner: User;

  @OneToMany(() => Booking, (booking) => booking.studio)
  bookings: Booking[];

  @OneToMany(() => Room, (room) => room.studio, { cascade: true })
  rooms: Room[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: StudioStatus, default: StudioStatus.PENDING })
  status: StudioStatus;
}
