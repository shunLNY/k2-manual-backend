import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FileService } from 'src/common/service/file.service';


@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        // timeout: 60.0,
        baseURL: config.get('gmo.baseUrl'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [FileService],
  exports: [FileService],
})
export class CommonModule { }
