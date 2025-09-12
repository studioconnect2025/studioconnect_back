// src/auth/dto/studio-owner-register.dto.ts
import { IsString, IsEmail, MinLength, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class StudioOwnerRegisterDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @IsString()
  @Matches(/^[+]?[\d\s-]{7,15}$/, {
    message: 'phoneNumber debe ser un teléfono válido (7-15 dígitos, puede incluir +, espacios o guiones)',
  })
  @Transform(({ value }) => value?.trim())
  phoneNumber: string;
}
