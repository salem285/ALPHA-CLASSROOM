import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const uploadsDir = join(process.cwd(), 'uploads', 'recordings');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static assets from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Set global API prefix: /api/v1
  app.setGlobalPrefix('api/v1');

  // Enable global validation pipe with whitelist and transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS for local frontend communication (allowing port 3001 and 3000)
  const allowedOrigins = [
    'http://localhost:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3000',
  ];
  if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`[ALPHA CLASSROOM] Backend API running on http://localhost:${port}/api/v1`);
  console.log(`[ALPHA CLASSROOM] Health check available at http://localhost:${port}/api/v1/health`);
}
await bootstrap();
