// src/geocoding/geocoding.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeocodingService } from './geocoding.service';
import { Studio } from '../studios/entities/studio.entity';
import { Profile } from '../profile/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Studio, Profile])],
  providers: [GeocodingService,],
  exports: [GeocodingService,],
})
export class GeocodingModule {}

