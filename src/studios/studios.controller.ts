import { Controller, Post, Body, Request, Get, Put, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { StudiosService } from './studios.service';
import { CreateStudioDto } from './dto/create-stuido.dto';
import { UpdateStudioDto } from './dto/update-studio.dto'; 

// import { UserRole } from '../auth/enum/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('studios')
export class StudiosController {
  constructor(private readonly studiosService: StudiosService) { }

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.STUDIO_OWNER)
  async create(@Body() dto: CreateStudioDto, @Request() req) {
    return this.studiosService.create(dto, req.user);
  }

  @Get('me')
  async findMyStudios(@Request() req) {
    return this.studiosService.findMyStudios(req.user);
  }

  @Put('me/:id')
  async updateMyStudio(
    @Param('id') id: number,
    @Body() dto: UpdateStudioDto,
    @Request() req,
  ) {
    return this.studiosService.updateMyStudio(req.user, id, dto);
  }

  @Post('me/:id/photos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.studiosService.uploadPhoto(req.user, id, file);
  }

}
