import { Module } from '@nestjs/common';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import TokenEntity from './entities/token.entity';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const jwtConfig = configService.get('jwt.encode');
        if (!jwtConfig) {
          throw new Error('JWT configuration not found');
        }
        return jwtConfig;
      },
    }),
    TypeOrmModule.forFeature([TokenEntity]),

  ],
  controllers: [TokensController],
  providers: [TokensService ]
})
export class TokensModule { }
