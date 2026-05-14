import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '100mb', extended: true }));
   
  /**
   * server static files 
   * caution: all files is exposed to public
   */
  app.useStaticAssets(join(__dirname, '..', 'storage'), {
    prefix: '/storage/',
    setHeaders: (res, path) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
  });

  
  app.enableCors({
    origin: '*',
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  });

  await app.listen(process.env.APP_PORT ?? 4000);
}

bootstrap();
