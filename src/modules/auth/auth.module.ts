import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokensModule } from '../tokens/tokens.module';
import { AccountsModule } from '../accounts/accounts.module';
import { JwtStrategy } from './strategy/jwt.strategy';
import { TokensService } from '../tokens/tokens.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtConfig = configService.get('jwt.encode');
        if (!jwtConfig) {
          throw new Error('JWT configuration not found');
        }
        return jwtConfig;
      },
      inject: [ConfigService],
    }),
    TokensModule,
    AccountsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokensService],
  exports: [JwtModule],
})
export class AuthModule {}
