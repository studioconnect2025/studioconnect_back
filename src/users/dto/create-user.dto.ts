import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../../auth/enum/roles.enum';

export class CreateUserDto {
  @IsEmail({}, { message: 'El email proporcionado no es válido.' })
  @IsNotEmpty({ message: 'El email no puede estar vacío.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'El hash de la contraseña no puede estar vacío.' })
  passwordHash: string;

  @IsEnum(UserRole, { message: 'El rol proporcionado no es válido.' })
  @IsNotEmpty({ message: 'El rol no puede estar vacío.' })
  role: UserRole;
}

