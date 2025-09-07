import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { PasswordResetService } from '../services/password-reset.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ValidateTokenDto,
} from '../dto/password-reset.dto';

@ApiTags('Password Reset')
@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña',
    description: 'Envía un email con un enlace para restablecer la contraseña',
  })
  @ApiResponse({
    status: 200,
    description: 'Email de recuperación enviado (o mensaje genérico por seguridad)',
    schema: {
      example: {
        message: 'Si el email existe, recibirás un enlace de recuperación',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Error en la validación de datos o al enviar el email',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.passwordResetService.forgotPassword(forgotPasswordDto);
  }

  @Get('validate-token')
  @ApiOperation({
    summary: 'Validar token de recuperación',
    description: 'Verifica si un token de recuperación es válido y no ha expirado',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de validación del token',
    schema: {
      example: { valid: true },
    },
  })
  async validateToken(@Query() validateTokenDto: ValidateTokenDto) {
    return await this.passwordResetService.validateResetToken(validateTokenDto);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description: 'Restablece la contraseña usando un token válido',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
    schema: {
      example: {
        message: 'Contraseña actualizada exitosamente',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Token inválido, expirado, o error en la validación',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.passwordResetService.resetPassword(resetPasswordDto);
  }
}