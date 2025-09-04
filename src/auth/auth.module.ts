import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { StudiosModule } from 'src/studios/studios.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt-strategy'; 

@Module({
  imports: [
    UsersModule,
    StudiosModule,
    PassportModule, 
    JwtModule.register({
      secret: 'YOUR_SECRET_KEY',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], 
})
export class AuthModule {}

