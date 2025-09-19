import { IsEnum, IsNotEmpty } from 'class-validator';
import { PqrStatus } from '../entities/pqr.entity';

export class UpdatePqrStatusDto {
  @IsEnum(PqrStatus)
  @IsNotEmpty()
  status: PqrStatus;
}