import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { UsersModule } from 'src/users/users.module';
import { User } from 'src/users/entities/user.entity';
import { FileUploadModule } from 'src/file-upload/file-upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, User]), 
    forwardRef(() => UsersModule),
    FileUploadModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService, TypeOrmModule],
})
export class ProfileModule {}
