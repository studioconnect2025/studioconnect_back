import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstrumentosModule } from './instrumentos/instrumentos.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StudiosModule } from './studios/studios.module';
import { CategoriasModule } from './categorias/categorias.module';
import { SeederModule } from './seeder/seeder.module';
import { BookingsModule } from './booking/bookings.module';
import { FileUploadModule } from './file-upload/file-upload.module';

@Module({
  imports: [
    InstrumentosModule,
    UsersModule,
    AuthModule,
    StudiosModule,
    CategoriasModule,
    SeederModule,
    BookingsModule,
    FileUploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

