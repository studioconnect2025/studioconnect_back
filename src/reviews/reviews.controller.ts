import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/enum/roles.enum';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PublicReviewDto } from './dto/public-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  // Crear reseña (solo músico)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MUSICIAN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear reseña de una reserva (solo MÚSICO)' })
  @ApiParam({ name: 'bookingId', description: 'ID de la reserva a reseñar' })
  @ApiBody({ type: CreateReviewDto })
  @Post(':bookingId')
  async createReview(
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateReviewDto,
    @Request() req,
  ) {
    return this.reviewsService.createReview(bookingId, dto, req.user);
  }

  // Obtener reseñas públicas de una sala
  @ApiOperation({ summary: 'Obtener reseñas públicas de una sala' })
  @ApiParam({ name: 'roomId', description: 'ID de la sala' })
  @Get('room/:roomId')
  async getRoomReviews(@Param('roomId') roomId: string) {
    return this.reviewsService.getReviewsForRoom(roomId);
  }

  // Obtener reseñas de todas las salas de un dueño (solo dueño)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STUDIO_OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener reseñas de mis salas (solo DUEÑO)' })
  @Get('owner/my-reviews')
  async getOwnerReviews(@Request() req) {
    return this.reviewsService.getReviewsForOwner(req.user.id);
  }

  @ApiOperation({ summary: 'Obtener todas las reseñas públicas resumidas (público)' })
  @Get('public/all')
  async getAllPublicReviews(): Promise<PublicReviewDto[]> {
    return this.reviewsService.getAllPublicReviews();
  }

}
