import { IsEmail, IsNotEmpty, IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email del usuario que quiere recuperar su contraseña',
    example: 'usuario@example.com',
  })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperación de contraseña',
    example: 'uuid-token-here',
  })
  @IsString({ message: 'El token debe ser una cadena válida' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  @ApiProperty({
    description: 'Nueva contraseña del usuario',
    example: 'nuevaPassword123',
  })
  @IsString({ message: 'La contraseña debe ser una cadena' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  newPassword: string;
}

export class ValidateTokenDto {
  @ApiProperty({
    description: 'Token a validar',
    example: 'uuid-token-here',
  })
  @IsString({ message: 'El token debe ser una cadena válida' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;
}