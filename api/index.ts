import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationError } from 'class-validator';
import { Request, Response, json, urlencoded } from 'express';
import express from 'express';
import { join } from 'path';
import { AppModule } from '../src/app.module';

const server = express();
let bootstrapPromise: Promise<void> | null = null;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
  );

  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '100mb', extended: true }));

  app.useStaticAssets(join(process.cwd(), 'storage'), {
    prefix: '/storage/',
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
  });

  app.enableCors({
    origin: '*',
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );
        return new BadRequestException(messages);
      },
    }),
  );

  await app.init();
}

export default async function handler(req: Request, res: Response) {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap();
  }

  await bootstrapPromise;
  return server(req, res);
}
