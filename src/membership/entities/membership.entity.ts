import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Studio } from 'src/studios/entities/studio.entity';
import { MembershipPlan, MembershipStatus } from '../enum/enum.membership';

@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Studio, (studio) => studio.memberships, { eager: true })
  studio: Studio;

  @Column({
    type: 'enum',
    enum: MembershipPlan,
  })
  plan: MembershipPlan;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.INACTIVE,
  })
  status: MembershipStatus;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  paymentId?: string; // referencia al pago
}
