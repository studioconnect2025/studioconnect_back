import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { User } from 'src/users/entities/user.entity'; 
import { UsersService } from 'src/users/users.service';
import { EmailService } from './email.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ValidateTokenDto,
} from '../dto/password-reset.dto';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    // Buscar el usuario por email
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      // Por seguridad, siempre devolvemos el mismo mensaje
      // aunque el usuario no exista
      return {
        message: 'Si el email existe, recibirás un enlace de recuperación',
      };
    }

    // Invalidar tokens anteriores del usuario
    await this.passwordResetTokenRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    // Generar nuevo token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Crear registro de token (expira en 1 hora)
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1);

    const passwordResetToken = this.passwordResetTokenRepository.create({
      token: hashedToken,
      userId: user.id,
      expiresAt: tokenExpiry,
      isUsed: false,
    });

    await this.passwordResetTokenRepository.save(passwordResetToken);

    // Enviar email con el token original (no hasheado)
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
      this.logger.log(`Token de recuperación generado para usuario: ${user.id}`);
    } catch (error) {
      this.logger.error('Error enviando email de recuperación:', error);
      // Eliminar el token si no se pudo enviar el email
      await this.passwordResetTokenRepository.delete(passwordResetToken.id);
      throw new BadRequestException('Error al enviar el email de recuperación');
    }

    return {
      message: 'Si el email existe, recibirás un enlace de recuperación',
    };
  }

  async validateResetToken(validateTokenDto: ValidateTokenDto): Promise<{ valid: boolean }> {
    const { token } = validateTokenDto;

    // Buscar tokens válidos (no usados y no expirados)
    const validTokens = await this.passwordResetTokenRepository.find({
      where: {
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    // Verificar si algún token coincide
    for (const tokenRecord of validTokens) {
      const isValidToken = await bcrypt.compare(token, tokenRecord.token);
      if (isValidToken) {
        return { valid: true };
      }
    }

    return { valid: false };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // Buscar tokens válidos
    const validTokens = await this.passwordResetTokenRepository.find({
      where: {
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    let tokenRecord: PasswordResetToken | null = null;

    // Verificar si algún token coincide
    for (const record of validTokens) {
      const isValidToken = await bcrypt.compare(token, record.token);
      if (isValidToken) {
        tokenRecord = record;
        break;
      }
    }

    if (!tokenRecord) {
      throw new BadRequestException('Token inválido o expirado');
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar la contraseña del usuario usando UsersService
    await this.usersService.updatePassword(tokenRecord.userId, hashedPassword);

    // Marcar el token como usado
    await this.passwordResetTokenRepository.update(tokenRecord.id, {
      isUsed: true,
    });

    // Invalidar todos los tokens del usuario por seguridad
    await this.passwordResetTokenRepository.update(
      { userId: tokenRecord.userId, isUsed: false },
      { isUsed: true },
    );

    this.logger.log(`Contraseña actualizada para usuario: ${tokenRecord.userId}`);

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }

  // Método para limpiar tokens expirados (opcional, para ejecutar como cron job)
  async cleanExpiredTokens(): Promise<void> {
    const result = await this.passwordResetTokenRepository.delete({
      expiresAt: MoreThan(new Date()),
    });

    this.logger.log(`Tokens expirados eliminados: ${result.affected}`);
  }
}