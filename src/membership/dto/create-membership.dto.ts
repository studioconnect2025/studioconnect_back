import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MembershipPlan } from '../enum/enum.membership';

export class CreateMembershipDto {
  @ApiProperty({ description: 'Plan de membresía', enum: MembershipPlan })
  @IsNotEmpty()
  @IsEnum(MembershipPlan)
  plan: MembershipPlan;

  @IsOptional()
  @IsString()
  paymentId?: string;
}
