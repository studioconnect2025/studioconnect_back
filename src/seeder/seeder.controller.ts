import { Controller, Post, UseGuards } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Controller('seeder')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SeederController {
  constructor(private readonly seederService: SeederService) {}

  @Post('reset')
  @Roles(UserRole.ADMIN)
  async resetseed() {
    return this.seederService.resetData();
  }
}
