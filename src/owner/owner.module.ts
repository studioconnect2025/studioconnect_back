import { Module } from '@nestjs/common';
import { OwnersController } from './owner.controller';
import { StudiosModule } from 'src/studios/studios.module';
import { RoomsModule } from 'src/rooms/rooms.module';

@Module({
  imports: [StudiosModule, RoomsModule],
  controllers: [OwnersController],
})
export class OwnersModule {}
