import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';

export enum MembershipPlan {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export class CreateMembershipPaymentDto {
  @ApiProperty({ description: 'Plan de membresía', enum: MembershipPlan })
  @IsNotEmpty()
  @IsEnum(MembershipPlan)
  plan: MembershipPlan;
}
