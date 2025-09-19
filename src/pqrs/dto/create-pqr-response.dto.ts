import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePqrResponseDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}