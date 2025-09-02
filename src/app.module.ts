import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstrumentosModule } from './instrumentos/instrumentos.module';

@Module({
  imports: [InstrumentosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
