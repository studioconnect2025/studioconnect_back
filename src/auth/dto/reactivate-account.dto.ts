import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ReactivateAccountDto {

  @ApiProperty({
    description: 'La dirección de correo electrónico de la cuenta que se va a reactivar.',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}