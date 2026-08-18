import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { existsSync, mkdirSync, unlink, writeFile } from 'fs';

import * as fs from 'fs/promises';
import * as path from 'node:path';
import { DataSource, Repository } from 'typeorm';
import { FileStorageEntity } from '../entity/file-storage.entity';
import { formatDate } from './helper.service';


@Injectable()
export class FileService {
  private basePath: string;
  private fileStorageRepo: Repository<FileStorageEntity>;
  private readonly logger = new Logger(FileService.name);
  

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(
    configService: ConfigService,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    const storage = configService.get('storage');
    this.basePath = storage.path;
    this.fileStorageRepo = this.dataSource.getRepository(FileStorageEntity);
  }

  private useDatabaseStorage() {
    return process.env.FILE_STORAGE_DRIVER === 'db' || process.env.VERCEL === '1';
  }

  generateFileName(
    fileExtension: string,
    name: string,
    type?: string,
    custom?: string,
  ) {
    const randomName = Array(8)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    const formattedDate = formatDate(new Date(), 'YYYY-MM-DD_H-mm-ss');
    const [file, ext] = fileExtension.split('/');
    const fileName = `${name ?? 'F'}_${formattedDate}_${randomName}.${ext}`;
    return fileName;
  }

  generateFilePrefix(name: string) {
    const randomName = Array(8)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    const formattedDate = formatDate(new Date(), 'YYYY-MM-DD_H-mm-ss');
    const fileName = `${name ?? 'F'}_file_${formattedDate}_${randomName}`;
    return fileName;
  }

  generateStoragePath(uploadPath: string, originalName: string, sku?: string) {
    const fileExtName = path.extname(originalName);
    return `${this.basePath}${uploadPath}/${this.generateFilePrefix(
      sku ?? 'F',
    )}${fileExtName}`;
  }

  async saveUploadedFile(
    storagePath: string,
    file: Express.Multer.File,
  ): Promise<string> {
    if (!this.useDatabaseStorage()) {
      return storagePath;
    }

    await this.fileStorageRepo.save({
      path: storagePath,
      data: file.buffer,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size,
    });

    return storagePath;
  }

  async getStoredFile(filePath: string) {
    if (!this.useDatabaseStorage()) return null;

    return this.fileStorageRepo.findOne({
      where: {
        path: filePath,
      },
    });
  }

  private upload(
    base64: string,
    fileExtension: string,
    name: string,
    path: string,
  ) {
    const location = `${this.basePath ?? ''}${path}`;
    const fileName = `${location}/${this.generateFileName(
      fileExtension,
      name,
    )}`;
    try {
      if (this.useDatabaseStorage()) {
        const buffer = Buffer.from(base64, 'base64');
        this.fileStorageRepo.save({
          path: fileName,
          data: buffer,
          mimeType: fileExtension,
          size: buffer.length,
        });
        return fileName;
      }

      mkdirSync(`.${location}`, { recursive: true });
      writeFile(`.${fileName}`, base64, 'base64', (error) => {
        if (error) {
          console.error('Error writing file:', error);
        } else {
          console.log('Test File written successfully.');
        }
      });
      return fileName;
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  }

  uploadBase64File({
    base64,
    name,
    path,
  }: {
    base64: string;
    name: string;
    path: string;
  }) {
    try {
      if (!base64 || !base64.length) return null;
      const [type, b64] = base64.split(',');
      const fileExtension = type.substring(
        type.indexOf(':') + 1,
        type.lastIndexOf(';'),
      );
      return this.upload(b64, fileExtension, name, path);
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error('File upload failed');
    }
  }

  delete(file: string) {
    if (this.useDatabaseStorage()) {
      this.fileStorageRepo.delete({ path: file });
      return;
    }

    if (existsSync(`.${file}`)) {
      unlink(`.${file}`, (err) => {
        if (err) {
          console.error('Error:', err);
        } else {
          console.log('File was successfully deleted!');
        }
      });
    }
  }

  async getFile(res: any, file: string) {
    const storedFile = await this.getStoredFile(file);
    if (storedFile) {
      res.set('Content-Type', storedFile.mimeType);
      return res.send(storedFile.data);
    }

    const root = `.${file.substring(0, file.lastIndexOf('/') + 1)}`;
    const fileName = file.substring(file.lastIndexOf('/') + 1, file.length);

    if (existsSync(`.${file}`)) return res.sendFile(fileName, { root });
    else throw new NotFoundException();
  }

  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    if (this.useDatabaseStorage()) {
      await this.fileStorageRepo.update(
        { path: sourcePath },
        { path: destinationPath },
      );
      return;
    }

    // 1. Create the destination directory if it does not exist
    // Set the `recursive` option to `true` to create all the subdirectories
    await fs.mkdir('.' + path.dirname(destinationPath), { recursive: true });

    // Move the file
    return fs.rename('.' + sourcePath, '.' + destinationPath);
  }

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // async handleCron() {
  //   this.logger.log('Running temp file cleanup...');
  //   await this.autoCleanUp(this.tmpImageDir);
  //   await this.autoCleanUp(this.tmpVideoDir);
  // }

  async autoCleanUp(tmpDir: string) {
    try {
      const files = await fs.readdir(tmpDir);

      for (const file of files) {
        if (file.startsWith('tmp_')) {
          const filePath = path.join(tmpDir, file);

          try {
            await fs.unlink(filePath);
            this.logger.log(`Deleted ${filePath}`);
          } catch (unlinkErr) {
            this.logger.warn(
              `Failed to delete ${filePath}: ${unlinkErr.message}`,
            );
          }
        }
      }
    } catch (err) {
      this.logger.error(`Failed to read tmp directory: ${err.message}`);
    }
  }
}
