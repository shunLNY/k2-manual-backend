import * as path from 'path';
import * as dotenv from 'dotenv'; //6.8k (gzipped: 3k)
import { DataSource, DataSourceOptions } from 'typeorm';
const env = dotenv.config().parsed;
dotenv.config();

console.log('DB_USER:', process.env.DB_USERNAME);
const dbSslCa = process.env.DB_SSL_CA?.replace(/\\n/g, '\n');

const options: DataSourceOptions = {
  type: 'mysql',
  // host: process.env.DB_HOST,
  // port: Number(process.env.DB_PORT || 3308),
  // username: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  // database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [path.resolve(`${__dirname}/../modules/**/*.entity.{js,ts}`)],
  migrations: [path.resolve(`${__dirname}/../database/migrations/*{.ts,.js}`)],
  synchronize: false,
  charset: 'utf8mb4_unicode_ci',
  logging: true,
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          rejectUnauthorized: Boolean(dbSslCa),
          ...(dbSslCa ? { ca: dbSslCa } : {}),
        }
      : undefined,
};

const AppDataSource = new DataSource(options);

export default AppDataSource;
