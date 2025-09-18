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
  BadRequestException,
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
import { JwtRegistrationGuard } from './guard/jwt-registration.guard';
import { GoogleRegistrationDto } from './dto/google-registration.dto';
import { UserRole } from './enum/roles.enum';

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
@ApiOperation({ summary: 'Iniciar autenticación con Google' })
handleGoogleLogin() {
  // El cuerpo de este método puede estar vacío.
  // El guard @UseGuards(AuthGuard('google')) intercepta la solicitud
  // y redirige al usuario a Google antes de que se ejecute este código.
}

 @Get('google/callback')
@UseGuards(AuthGuard('google'))
@ApiOperation({ summary: 'Callback de Google' })
async handleGoogleCallback(@Req() req, @Res() res: Response) {
 
  
  const result = await this.authService.handleGoogleAuth(req.user);
  const frontendUrl = process.env.FRONTEND_URL; // Debe ser http://localhost:3000

  

  if (result.status === 'LOGIN_SUCCESS') {
    const accessToken = result.data.access_token;
    const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}`;
    res.redirect(redirectUrl);
  } 
  else if (result.status === 'REGISTRATION_REQUIRED') {
    const registrationToken = result.data.token;
    const redirectUrl = `${frontendUrl}/register-google?reg_token=${registrationToken}`;
    res.redirect(redirectUrl);
  }
}

  @Post('register/google')
  @UseGuards(JwtRegistrationGuard) // <-- Usa el nuevo guard para proteger la ruta
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Completar registro con Google' })
  @ApiBearerAuth('JWT-Registration') // Documentación para Swagger
  async completeGoogleRegistration(@Req() req, @Body() dto: GoogleRegistrationDto) {
    const googleProfile = req.user;
    const { role } = dto;
    
    // Una validación extra nunca está de más
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException('El rol proporcionado no es válido.');
    }

    return this.authService.completeGoogleRegistration(googleProfile, role);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
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
