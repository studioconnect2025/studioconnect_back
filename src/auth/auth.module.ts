import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { StudiosModule } from 'src/studios/studios.module'; 

@Module({
  imports: [
    UsersModule,
    StudiosModule, 
    JwtModule.register({
      global: true,
      secret: 'CAMBIAME_POR_UNA_VARIABLE_DE_ENTORNO',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
