import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { StudioStatus } from '../enum/studio-status.enum';

@Entity('studios')
export class Studio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  studioType: string;

  @Column()
  city: string;

  @Column()
  province: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'text', length: 500 })
  description: string;

  @Column('text', { array: true, nullable: true }) 
  photos?: string[];

  @Column('text', { array: true, nullable: true })
  availableEquipment?: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dailyRate?: number;

  @Column({ nullable: true })
  openingTime?: string;

  @Column({ nullable: true })
  closingTime?: string;

  @ManyToOne(() => User, (user) => user.studios, { eager: true })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
  type: 'enum',
  enum: StudioStatus,
  default: StudioStatus.PENDING,
})
status: StudioStatus;

}
