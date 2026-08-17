import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import * as fs from 'fs';
import { ExtractJwt } from 'passport-jwt';

export default () => {
  const jwtPrivateKey = fs.readFileSync('./jwt_private_key.pem', 'utf8');
  const jwtAlgorithm = 'RS256';
  const dbSslCa = process.env.DB_SSL_CA?.replace(/\\n/g, '\n');

  const defaultOptions: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [join(__dirname, '../modules/**/**.entity{.ts,.js}')],
    synchronize: false,
    charset: 'utf8mb4_unicode_ci',
    logging: process.env.DB_DEBUG === 'TRUE',
    ssl:
      process.env.DB_SSL === 'true'
        ? {
            rejectUnauthorized: Boolean(dbSslCa),
            ...(dbSslCa ? { ca: dbSslCa } : {}),
          }
        : undefined,
  };

  return {
    app: {
      env: process.env.APP_ENV,
      port: process.env.APP_PORT,
      timezone: process.env.APP_TIMEZONE,
      frontendUrl: process.env.FRONTEND_URL,
    },
    database: {
      defaultOptions,
    },
    jwt: {
      pcRefreshTokenExpire: process.env.PC_REFRESH_TOKEN_EXPIRE,
      mobileRefreshTokenExpire: process.env.MOBILE_REFRESH_TOKEN_EXPIRE,
      accessTokenExpire: process.env.ACCESS_TOKEN_EXPIRE,
      encode: {
        privateKey: jwtPrivateKey,
        publicKey: fs.readFileSync('./jwt_public_key.pem', 'utf8'),
        signOptions: {
          expiresIn: (process.env.ACCESS_TOKEN_EXPIRE ?? '1h').replace('-', ''),
          algorithm: jwtAlgorithm,
        },
      },
      decode: {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: jwtPrivateKey,
        algorithms: [jwtAlgorithm],
        passReqToCallback: true,
      },
    },
    storage: {
      path: process.env.STORAGE_PATH,
    },
    fileUrlPrefix: process.env.FILE_URL_PREFIX,
    // authentication
  };
};
