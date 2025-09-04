import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstrumentosModule } from './instrumentos/instrumentos.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StudiosModule } from './studios/studios.module';
<<<<<<< HEAD
import { CategoriesModule } from './categories/categories.module';
import { SeederModule } from './seeder/seeder.module';
import { BookingsModule } from './bookings/bookings.module';
=======
import { CategoriasModule } from './categorias/categorias.module';
import { SeederModule } from './seeder/seeder.module';
import { BookingsModule } from './booking/bookings.module';
>>>>>>> 33777e683ebc47ce69073cc30104acdce96a5905
import { FileUploadModule } from './file-upload/file-upload.module';

@Module({
  imports: [
    InstrumentosModule,
    UsersModule,
    AuthModule,
    StudiosModule,
<<<<<<< HEAD
    CategoriesModule,
=======
    CategoriasModule,
>>>>>>> 33777e683ebc47ce69073cc30104acdce96a5905
    SeederModule,
    BookingsModule,
    FileUploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
<<<<<<< HEAD
=======

>>>>>>> 33777e683ebc47ce69073cc30104acdce96a5905
