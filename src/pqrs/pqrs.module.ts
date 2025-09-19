import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pqr } from './entities/pqr.entity';
import { PqrsService } from './pqrs.service';
import { PqrsController } from './pqrs.controller';
import { PqrsGateway } from './pqrs.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { PqrResponse } from './entities/pqr-response.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pqr, PqrResponse]), 
    AuthModule, 
    UsersModule
  ],
  controllers: [PqrsController],
  providers: [PqrsService, PqrsGateway], // Importante registrar el Gateway aquí
})
export class PqrsModule {}