import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room } from './entities/room.entity';
import { Studio } from 'src/studios/entities/studio.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { EmailModule } from 'src/auth/modules/email.module';
import { MembershipModule } from 'src/membership/membership.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Studio]),
    FileUploadModule,
    EmailModule, // Importar el módulo de subida de archivos
    MembershipModule, // NEW
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
