import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService], // 1. Declara el servicio como parte de este módulo
  exports: [UsersService],   // 2. Exporta el servicio para que otros módulos puedan usarlo
})
export class UsersModule {}

