import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { MembershipPlan } from 'src/membership/enum/enum.membership';

export class CreateMembershipPaymentDto {
  @ApiProperty({ description: 'Plan de membresía', enum: MembershipPlan })
  @IsNotEmpty()
  @IsEnum(MembershipPlan)
  plan: MembershipPlan;
}
