/* eslint-disable @typescript-eslint/require-await */
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { CategoriesModule } from './modules/categories/categories.module';
import configuration from './config/config';
import { AppService } from './app.service';
import { TokensModule } from './modules/tokens/tokens.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountsController } from './modules/accounts/accounts.controller';
import { AccountsService } from './modules/accounts/accounts.service';
import { AccountsModule } from './modules/accounts/accounts.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { CommonModule } from './modules/common.module';
import { FileModule } from './common/module/file.module';
import { CacheModule } from '@nestjs/cache-manager';
import { Article } from './modules/articles/entities/article.entity';
import { ArticlesModule } from './modules/articles/articles.module';
import { AccountEntity } from './modules/accounts/entities/account.entity';
import { CategoriesEntity } from './modules/categories/entities/category.entity';
import TokenEntity from './modules/tokens/entities/token.entity';

@Module({
  imports: [
    CacheModule.register({ isGlobal: true, ttl: 60000 }),
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.local'],
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,

      autoLoadEntities: true,
      synchronize: false,
      entities: [AccountEntity, CategoriesEntity, TokenEntity],
    }),

    AccountsModule,
    CategoriesModule
  ],
  controllers: [AppController, AccountsController],
  providers: [AppService, AccountsService],
})
export class AppModule { }
