import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3001/'], // aquí ponés la URL de tu front
    credentials: true, // si después necesitás enviar cookies
  });
  // Pipes globales con configuración
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades que no están en el DTO
      forbidNonWhitelisted: true, // lanza error si envían propiedades extra
      transform: true, // transforma automáticamente tipos según DTO
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
  SwaggerModule.setup('api', app, document); // http://localhost:3000/api

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
