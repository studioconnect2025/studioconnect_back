import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { StudioOwnerRegisterDto } from 'src/users/dto/owner.dto';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth') // "Auth" en Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Registro de un nuevo dueño de estudio' })
  @ApiResponse({ status: 201, description: 'Dueño de estudio registrado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos para el registro' })
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
}

