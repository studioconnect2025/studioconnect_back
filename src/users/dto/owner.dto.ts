import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  ValidateNested,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';


export class OwnerInfoDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;
}


class StudioInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsString()
  @IsNotEmpty()
  studioType: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
  
  @IsEmail()
  @IsOptional()
  email?: string;
  
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableEquipment?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  dailyRate?: number;

  @IsString()
  @IsOptional()
  openingTime?: string; 

  @IsString()
  @IsOptional()
  closingTime?: string; 
}


export class StudioOwnerRegisterDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OwnerInfoDto)
  ownerInfo: OwnerInfoDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => StudioInfoDto)
  studioInfo: StudioInfoDto;
}
