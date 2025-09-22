import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { Studio } from 'src/studios/entities/studio.entity';
import { MembershipsService } from './membership.service';
import { MembershipsController } from './membership.controller';
import { EmailService } from 'src/auth/services/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, Studio])],
  controllers: [MembershipsController],
  providers: [MembershipsService, EmailService],
  exports: [MembershipsService], // 👈 necesario para que PaymentsModule lo use
})
export class MembershipModule {}
