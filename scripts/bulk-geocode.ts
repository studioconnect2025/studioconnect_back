// // scripts/bulk-geocode.ts
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from '../src/app.module';
// import { BulkGeocodeService } from '../src/geocoding/bulk-geocode.service';

// async function bootstrap() {
//   const appContext = await NestFactory.createApplicationContext(AppModule);

//   try {
//     const service = appContext.get(BulkGeocodeService);
//     await service.run();
//     console.log('✅ Bulk geocode completado');
//   } catch (err) {
//     console.error('❌ Error en bulk geocode:', err);
//   } finally {
//     await appContext.close();
//   }
// }

// bootstrap();



