import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <-- 1. Importa ConfigModule
import { EmailService } from '../services/email.service';

@Module({
  imports: [ConfigModule], // <-- 2. Añade ConfigModule a los imports
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

