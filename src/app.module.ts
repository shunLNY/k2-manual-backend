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
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { CommonModule } from './modules/common.module';
import { FileModule } from './common/module/file.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ArticlesModule } from './modules/articles/articles.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    CacheModule.register({ isGlobal: true, ttl: 60000 }),
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.local'],
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, CacheModule.register()],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<TypeOrmModuleOptions> => {
        const dbConfig = configService.get<TypeOrmModuleOptions>(
          'database.defaultOptions',
        );
        if (!dbConfig) {
          throw new Error('Missing database.defaultOptions in config');
        }
        return dbConfig;
      },
    }),
    // メール送信設定
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: process.env.MAIL_FROM,
      },
      template: {
        dir: process.cwd() + '/templates/',
        adapter: new HandlebarsAdapter(),
      },
    }),
    CommonModule,
    CategoriesModule,
    ArticlesModule,
    TokensModule,
    AuthModule,
    AccountsModule,
    FileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
