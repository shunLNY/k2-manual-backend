import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { FileService } from '../service/file.service';
import * as mime from 'mime-types';

import { Storage } from '../interceptor/storage.interceptor';
import { Public } from '../decorators/auth-user.decorator';

@Controller('files')
export class FileController {
  constructor(private fileService: FileService) { }

  @Get('storage/:classname/:subDir/:filename')
  @Public()
  async getFile(
    @Param('classname') classname: string,
    @Param('subDir') subDir: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const storagePath = `/storage/${classname}/${subDir}/${filename}`;
    const storedFile = await this.fileService.getStoredFile(storagePath);

    if (storedFile) {
      res.set('Content-Type', 'application/octet-stream');
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
      res.set('Content-Length', `${storedFile.size}`);
      return res.send(storedFile.data);
    }

    const fullPath = path.join(
      process.cwd(),
      `storage/${classname}/${subDir}/${filename}`,
    );

    // console.log(fullPath)

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
    res.set('Content-Type', `application/octet-stream`);
    res.set(
      'Content-Disposition',
      `attachment; filename="${path.basename(fullPath)}"`,
    );
    res.set('Content-Length', `${fs.statSync(fullPath).size}`);
  }

  @Get('image/storage/:classname/:subDir/:filename')
  @Public()
  async getImage(
    @Param('classname') classname: string,
    @Param('subDir') subDir: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const storagePath = `/storage/${classname}/${subDir}/${filename}`;
    const storedFile = await this.fileService.getStoredFile(storagePath);

    if (storedFile) {
      res.set('Content-Type', storedFile.mimeType);
      res.set('Content-Disposition', `inline`);
      res.set('Content-Length', `${storedFile.size}`);
      return res.send(storedFile.data);
    }

    const fullPath = path.join(
      process.cwd(),
      `storage/${classname}/${subDir}/${filename}`,
    );

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const mimeType = mime.lookup(fullPath) || 'application/octet-stream';

    const fileStream = fs.createReadStream(fullPath);
    res.set('Content-Type', mimeType);
    res.set('Content-Disposition', `inline`);
    res.set('Content-Length', `${fs.statSync(fullPath).size}`);
    fileStream.pipe(res);
  }

  @Storage({
    fieldName: 'thumbnail_path',
    path: '/_tmp/images',
    sku: 'tmp_',
    limits: { fileSize: 10000000 },
  })
  @Post('_tmp/image/upload')
  async tempImageUpload(@UploadedFile() file: Express.Multer.File) {
    if (file.buffer) {
      const storagePath = this.fileService.generateStoragePath(
        '/_tmp/images',
        file.originalname,
        'tmp_',
      );
      await this.fileService.saveUploadedFile(storagePath, file);
      return { path: storagePath, filename: path.basename(storagePath) };
    }

    const { path: filePath, filename } = file;
    return { path: '/' + filePath, filename };
  }

  

}
