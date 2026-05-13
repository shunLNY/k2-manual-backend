import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS 
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL, 
    ],
    credentials: true,
  });
  await app.listen(process.env.APP_PORT || 4000); 
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
