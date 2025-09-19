import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PqrType } from '../entities/pqr.entity';

export class CreatePqrDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(PqrType)
  @IsNotEmpty()
  type: PqrType;

  @IsUUID()
  @IsOptional()
  reportedUserId?: string; // Opcional
}