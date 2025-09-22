import { MembershipPlan, MembershipStatus } from '../enum/enum.membership';

export class MembershipResponseDto {
  id: string;
  plan: MembershipPlan;
  status: MembershipStatus;
  startDate: Date;
  endDate: Date;
}
