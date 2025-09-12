import { IsEmail, IsNotEmpty } from 'class-validator';

export class ReactivateAccountDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}