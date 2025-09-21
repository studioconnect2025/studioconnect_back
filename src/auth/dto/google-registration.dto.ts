import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../enum/roles.enum';

export class GoogleRegistrationDto {
  @ApiProperty({
    description: 'Rol que el usuario ha seleccionado',
    enum: [UserRole.MUSICIAN, UserRole.STUDIO_OWNER],
    example: UserRole.MUSICIAN,
  })
  @IsNotEmpty({ message: 'El rol no puede estar vacío.' })
  @IsEnum(UserRole)
  role: UserRole;
}