// main.ts
import * as bodyParser from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS con credenciales
  app.enableCors({
    origin(origin, cb) {
      const allowed = [
        'http://localhost:3001', // dev
        'https://studioconnect-front.vercel.app', // prod vercel
      ];
      const ok =
        !origin ||
        allowed.includes(origin) ||
        origin.endsWith('.vercel.app'); // previews
      cb(null, ok); // importante: devolver booleano
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Authorization',
    ],
    credentials: true, // si usás cookies, dejalo
    maxAge: 86400,
    optionsSuccessStatus: 204,
  });
  // ✅ Express: trust proxy (necesario en Render detrás de proxy)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // ✅ Sesión (usar env real, no string literal)
  app.use(
    session({
      name: 'sc.sid',
      secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        // en prod (https) secure:true y sameSite:'none' para permitir cross-site con Vercel
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 5,
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --- SECCIÓN MODIFICADA DE SWAGGER ---
  const config = new DocumentBuilder()
    .setTitle('API de Reservas de Estudio')
    .setDescription('Documentación de los endpoints de la API')
    .setVersion('1.0')
    // 1. Definición para el token de sesión normal (login)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Introduce el token de sesión (JWT)',
      },
      'JWT-auth', // Nombre del esquema para el login normal
    )
    // 2. Definición para el token de registro de Google
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Introduce el token temporal de registro de Google',
      },
      'JWT-Registration', // Nombre del esquema para completar el registro
    )
    .build();
  // --- FIN DE LA SECCIÓN MODIFICADA ---

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Error al iniciar la aplicación:', err);
});