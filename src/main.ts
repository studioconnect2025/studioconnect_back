// main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session'; // <-- 1. IMPORTAR SESSIÓN

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // <-- 2. AÑADIR LA CONFIGURACIÓN DE LA SESIÓN AQUÍ
  app.use(
    session({
      secret: 'process.env.SESSION_SECRET', // ¡MUY IMPORTANTE CAMBIAR ESTO!
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Poner en `true` si usas HTTPS en producción
        maxAge: 60000 * 5, // La sesión durará 5 minutos, suficiente para el login
      },
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3001'], // aquí ponés la URL de tu front
    credentials: true,
  });

  // Pipes globales con configuración
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Reservas de Estudio')
    .setDescription('Documentación de los endpoints de la API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Error al iniciar la aplicación:', err);
});