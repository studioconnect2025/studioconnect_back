import { Module } from '@nestjs/common';
import { StudiosService } from './studios.service';
import { StudiosController } from './studios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Studio } from './entities/studio.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { GeocodingModule } from 'src/geocoding/geocoding.module';
import { EmailModule } from 'src/auth/modules/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Studio]), FileUploadModule, GeocodingModule, EmailModule],
  controllers: [StudiosController],
  providers: [StudiosService],
  exports: [StudiosService], 
})
export class StudiosModule {}
