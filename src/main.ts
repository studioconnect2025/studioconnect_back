// main.ts
import * as bodyParser from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';

// --- Adaptador personalizado (Versión definitiva y funcional) ---
class CorsSocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    console.log('[ADAPTER LOG] Creando servidor de Socket.IO...');

    // 👇 LA CORRECCIÓN DEFINITIVA ESTÁ AQUÍ 👇
    // Ignoramos las 'options' que vienen de NestJS para evitar conflictos de tipos
    // y creamos una configuración limpia solo con lo que necesitamos.
    const server = super.createIOServer(port, {
      cors: {
        origin: [
            'http://localhost:3001', // El frontend de dev
            'https://studioconnect-front.vercel.app', // prod vercel
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    console.log('[ADAPTER LOG] Servidor de Socket.IO creado.');

    // --- Espía de errores de conexión ---
    server.engine.on('connection_error', (err) => {
        console.log('================================================');
        console.error('[ADAPTER LOG] ¡ERROR DE CONEXIÓN DETECTADO!');
        console.error(`[ADAPTER LOG] Código de error: ${err.code}`);
        console.error(`[ADAPTER LOG] Mensaje: ${err.message}`);
        console.error(`[ADAPTER LOG] Contexto:`, err.context);
        console.log('================================================');
    });

    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tu configuración de CORS para HTTP se mantiene igual
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
      cb(null, ok);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Authorization',
    ],
    credentials: true,
    maxAge: 86400,
    optionsSuccessStatus: 204,
  });

  // El resto de tu configuración no cambia
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.use(
    session({
        name: 'sc.sid',
        secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
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

  const config = new DocumentBuilder()
    .setTitle('API de Reservas de Estudio')
    .setDescription('Documentación de los endpoints de la API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Introduce el token de sesión (JWT)' }, 'JWT-auth')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Introduce el token temporal de registro de Google' }, 'JWT-Registration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));

  // Usamos el Adaptador personalizado
  app.useWebSocketAdapter(new CorsSocketIoAdapter(app)); 

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Servidor HTTP corriendo en el puerto ${process.env.PORT ?? 3000}`);
}
bootstrap().catch((err) => {
  console.error('Error al iniciar la aplicación:', err);
});