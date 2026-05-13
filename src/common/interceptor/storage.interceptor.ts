import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  applyDecorators,
  Injectable,
  mixin,
  NestInterceptor,
  Type,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import * as moment from 'moment';
import { extname } from 'path';
import * as fs from 'fs';


interface StorageInterceptorOptions {
  fieldName: string;
  path?: string;
  filter?: MulterOptions['fileFilter'];
  limits?: MulterOptions['limits'];
  sku?: string;
  multiple?: boolean;
}

function StorageInterceptor(
  options: StorageInterceptorOptions,
): Type<NestInterceptor> {
  @Injectable()
  class Interceptor implements NestInterceptor {
    fileInterceptor: NestInterceptor;
    constructor(configService: ConfigService) {
      const { path } = configService.get('storage');
      let storage: any;

      storage = diskStorage({
        destination: (req, file, callback) => {
          // check image to store in tenant directory or central directory

          const location = `.${path}${options.path}`;
          fs.mkdirSync(location, { recursive: true });
          callback(null, location);
        },
        filename: async (req, file, callback) => {
          const date = moment().format('Y-MM-DD_H-mm-ss');
          const name = `${options.sku ?? 'F'}_file_${date}`;
          const fileExtName = extname(file.originalname);
          const randomName = Array(8)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');

          callback(null, `${name}_${randomName}${fileExtName}`);
        },
      });

      const multerOptions: MulterOptions = {
        storage,
        fileFilter: options.filter,
        limits: options.limits,
      };
      this.fileInterceptor = options.multiple
        ? new (FilesInterceptor(options.fieldName, 30, multerOptions))()
        : new (FileInterceptor(options.fieldName, multerOptions))();
      return;
    }
    intercept(...args: Parameters<NestInterceptor['intercept']>) {
      return this.fileInterceptor.intercept(...args);
    }
  }
  return mixin(Interceptor);
}

export function Storage(options: StorageInterceptorOptions) {
  return applyDecorators(UseInterceptors(StorageInterceptor(options)));
}

export default StorageInterceptor;
