import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Session,
  Res
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { StudioOwnerRegisterDto } from 'src/users/dto/owner.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Registro de un nuevo dueño de estudio' })
  @ApiResponse({
    status: 201,
    description: 'Dueño de estudio registrado correctamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos para el registro' })
  @ApiBody({
    type: StudioOwnerRegisterDto,
    description:
      'Estructura de datos para registrar un nuevo dueño de estudio.',
    examples: {
      a: {
        summary: 'Ejemplo de Registro',
        value: {
          ownerInfo: {
            firstName: 'Juan',
            lastName: 'Perez',
            email: 'juan.perez@example.com',
            phoneNumber: '3101234567',
            password: 'password123',
          },
          studioInfo: {
            name: 'Estudio de Grabación Sónico',
            city: 'Bogotá',
            province: 'Cundinamarca',
            address: 'Calle Falsa 123',
            description: 'El mejor estudio para tus producciones musicales.',
          },
        },
      },
    },
  })
  @Post('register/studio-owner')
  registerStudioOwner(@Body() registerDto: StudioOwnerRegisterDto) {
    return this.authService.registerStudioOwner(registerDto);
  }

  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna un JWT' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // --- Rutas para Google OAuth ---
   @Get('google/login')
  @UseGuards(AuthGuard('google'))
  handleGoogleLogin(@Req() req, @Session() session: Record<string, any>) {
    // Guardamos la URI de redirección del frontend en la sesión
    const redirectUri = req.query.redirect_uri as string;
    if (redirectUri) {
      session.redirectUri = redirectUri;
    }
  }

  // 2. Modifica handleGoogleCallback para usar la sesión y redirigir
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async handleGoogleCallback(@Req() req, @Res() res: Response, @Session() session: Record<string, any>) {
    const tokenData = await this.authService.googleLogin(req);
    const jwtToken = tokenData.access_token;

    // Leemos la URI guardada y la usamos para la redirección final
    const redirectUri = session.redirectUri || process.env.FRONTEND_URL; // Un fallback por si acaso

    // Limpiamos la sesión
    session.redirectUri = null;
    
    // Redirigimos al frontend con el token en la URL
    res.redirect(`${redirectUri}?token=${jwtToken}`);
  }

  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente' })
  @ApiResponse({ status: 401, description: 'Token inválido o no autorizado' })
  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req) {
    // El req.user contiene el payload del token y el token mismo
    const token = req.headers.authorization.split(' ')[1];
    return this.authService.logout(token);
  }
}
