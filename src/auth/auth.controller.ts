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
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
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

// ✅ Usamos los DTOs unificados en users/dto
import { MusicianRegisterDto } from 'src/users/dto/musician-register.dto';
import { StudioOwnerRegisterDto } from 'src/users/dto/owner-register.dto';

import { ReactivateAccountDto } from './dto/reactivate-account.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- REGISTRO MÚSICO ---
  @Post('register/musician')
  @ApiOperation({ summary: 'Registro de un nuevo músico' })
  @ApiResponse({ status: 201, description: 'Músico registrado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos para el registro' })
  @ApiBody({
    type: MusicianRegisterDto,
    description: 'Payload para registrar un músico.',
    examples: {
      ejemplo1: {
        summary: 'Registro Básico de Músico',
        value: {
          email: 'nuevo.musico@example.com',
          password: 'PasswordSegura123!',
          confirmPassword: 'PasswordSegura123!',
          profile: {
            nombre: 'Carlos',
            apellido: 'Ruiz',
            numeroDeTelefono: '+5491112345678',
            ubicacion: {
              ciudad: 'Buenos Aires',
              provincia: 'CABA',
              calle: 'Av. Corrientes 1234',
              codigoPostal: 'C1043AAS',
            },
          },
        },
      },
    },
  })
  registerMusician(@Body() registerDto: MusicianRegisterDto) {
    return this.authService.registerMusician(registerDto);
  }

  // --- REGISTRO DUEÑO DE ESTUDIO ---
  @Post('register/studio-owner')
  @ApiOperation({ summary: 'Registro de un nuevo dueño de estudio' })
  @ApiResponse({ status: 201, description: 'Dueño de estudio registrado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos para el registro' })
  @ApiBody({
    type: StudioOwnerRegisterDto,
    description: 'Payload para registrar un dueño de estudio.',
    examples: {
      ejemplo: {
        summary: 'Registro Básico de Dueño',
        value: {
          email: 'juan.perez@example.com',
          password: 'PasswordSegura123!',
          confirmPassword: 'PasswordSegura123!',
          profile: {
            nombre: 'Juan',
            apellido: 'Pérez',
            numeroDeTelefono: '+549111111111',
            ubicacion: {
              ciudad: 'Córdoba',
              provincia: 'Córdoba',
              calle: 'San Martín 1500',
              codigoPostal: '5000',
            },
          },
        },
      },
    },
  })
  registerStudioOwner(@Body() registerDto: StudioOwnerRegisterDto) {
    return this.authService.registerStudioOwner(registerDto);
  }

  // --- LOGIN ---
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna un JWT' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // --- REACTIVAR CUENTA ---
  @Post('reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivar una cuenta inactiva' })
  @ApiResponse({ status: 200, description: 'Cuenta reactivada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiBody({
    type: ReactivateAccountDto,
    description: 'Usa el correo electrónico para reactivar la cuenta.',
    examples: {
      ejemplo1: {
        summary: 'Correo a reactivar',
        value: { email: 'cuenta.inactiva@example.com' },
      },
    },
  })
  reactivateAccount(@Body() reactivateDto: ReactivateAccountDto) {
    return this.authService.reactivateAccount(reactivateDto);
  }

  // --- Google OAuth ---
  @Get('google/login')
  @UseGuards(AuthGuard('google'))
  handleGoogleLogin(@Req() req, @Session() session: Record<string, any>) {
    const redirectUri = req.query.redirect_uri as string;
    if (redirectUri) session.redirectUri = redirectUri;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async handleGoogleCallback(
    @Req() req,
    @Res() res: Response,
    @Session() session: Record<string, any>,
  ) {
    const tokenData = await this.authService.googleLogin(req);
    const jwtToken = tokenData.access_token;
    const redirectUri = session.redirectUri || process.env.FRONTEND_URL;
    session.redirectUri = null;
    res.redirect(`${redirectUri}?token=${jwtToken}`);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente' })
  @ApiResponse({ status: 401, description: 'Token inválido o no autorizado' })
  async logout(@Req() req) {
    const token = req.headers.authorization.split(' ')[1];
    return this.authService.logout(token);
  }
}
