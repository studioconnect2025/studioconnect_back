import { IsNotEmpty, IsString } from 'class-validator';

export class CreateInstrumentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description?: string;
}
