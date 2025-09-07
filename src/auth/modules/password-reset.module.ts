import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PasswordResetService } from '../services/password-reset.service';
import { EmailService } from '../services/email.service';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { UsersModule } from '../../users/users.module';
import { PasswordResetController } from '../controllers/password-reset.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PasswordResetToken]),
    ConfigModule,
    UsersModule,
  ],
  controllers: [PasswordResetController],
  providers: [PasswordResetService, EmailService],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}