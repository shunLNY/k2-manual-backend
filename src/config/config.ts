import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import * as fs from 'fs';
import { ExtractJwt } from 'passport-jwt';

const readSecret = (envName: string, filePath: string) => {
  const base64Value = process.env[`${envName}_BASE64`];
  const envValue = process.env[envName];

  if (base64Value) {
    return Buffer.from(base64Value.trim(), 'base64').toString('utf8');
  }

  if (envValue) {
    return envValue
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .replace(/\\n/g, '\n');
  }

  return fs.readFileSync(filePath, 'utf8');
};

export default () => {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  const jwtPrivateKey = jwtSecret
    ? undefined
    : readSecret('JWT_PRIVATE_KEY', './jwt_private_key.pem');
  const jwtPublicKey = jwtSecret
    ? undefined
    : readSecret('JWT_PUBLIC_KEY', './jwt_public_key.pem');
  const jwtAlgorithm = jwtSecret ? 'HS256' : 'RS256';
  const dbSslCa = process.env.DB_SSL_CA?.replace(/\\n/g, '\n');

  const defaultOptions: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [
      join(__dirname, '../modules/**/**.entity{.ts,.js}'),
      join(__dirname, '../common/**/*.entity{.ts,.js}'),
    ],
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
        secret: jwtSecret,
        privateKey: jwtPrivateKey,
        publicKey: jwtPublicKey,
        signOptions: {
          expiresIn: (process.env.ACCESS_TOKEN_EXPIRE ?? '1h').replace('-', ''),
          algorithm: jwtAlgorithm,
        },
      },
      decode: {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: jwtSecret ?? jwtPublicKey,
        algorithms: [jwtAlgorithm],
        passReqToCallback: true,
      },
    },
    storage: {
      path: process.env.STORAGE_PATH || '/storage',
    },
    fileUrlPrefix: process.env.FILE_URL_PREFIX,
    // authentication
  };
};
