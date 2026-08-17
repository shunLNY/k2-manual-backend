import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AccountEntity } from '../accounts/entities/account.entity';
import { TokensService } from '../tokens/tokens.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { DEVICE_TYPE_HEADER, REFRESH_TOKEN_HEADER } from '../../common/constants';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
@Injectable()
export class AuthService {
  public accountRepo: Repository<AccountEntity>;

  constructor(
    @Inject(TokensService)
    private tokenService: TokensService,
    @InjectDataSource()
    private dataSource: DataSource,
    private readonly mailerService: MailerService,
    // private logService: AccessLogsService,
  ) {
    this.accountRepo = this.dataSource.getRepository(AccountEntity);
  }
  public async login(loginDTO: LoginDto, headers: any, ipAddress: any) {
    try {
      const loginUser = await this.accountRepo.findOne({
        where: {
          email: loginDTO.email,
        },
      });

      console.log(loginUser?.password, "........loginUser")

      if (!loginUser) throw new UnauthorizedException('incorrect credentials');

      let admin: any;
      admin = loginUser;

      console.log(loginUser, loginDTO)
      if (!(await bcrypt.compare(loginDTO.password, admin.password)))
        throw new UnauthorizedException('incorrect credentials');

      // generate token and save
      const { accessToken, refreshToken, accessTokenExpire, tokenId } =
        await this.tokenService.createToken(admin, headers, ipAddress);
      delete admin.password;

      // create new access log

      const logData = {
        userId: admin.id,
        ipAddress,
        tokenId,
        deviceType: headers[DEVICE_TYPE_HEADER],
        userAgent: headers['user-agent'],
      };
      // const { id: SESSION_ID } = await this.logService.createLog(logData);

      return { admin, accessToken, refreshToken, accessTokenExpire };
    } catch (err) {
      console.error("LOGIN EXCEPTION CAUGHT:", err);
      throw err;
    }
  }

  // get new token
  public async getNewToken(headers: any) {
    const deviceType = headers[DEVICE_TYPE_HEADER];

    const token = await this.tokenService.repo.findOne({
      relations: ['user'],
      where: {
        refreshToken: headers[REFRESH_TOKEN_HEADER],
        userAgent: headers['user-agent'],
        deviceType,
        // ipAddress,
      },
      select: [
        'id',
        'userId',
        'ipAddress',
        'deviceType',
        'userAgent',
        'refreshExpire',
        'refreshToken',
      ],
    });

    if (!token) {
      const oldToken = await this.tokenService.repo.findOne({
        relations: ['user'],
        where: {
          userAgent: headers['user-agent'],
          deviceType,
          // ipAddress,
        },
        select: [
          'id',
          'userId',
          'ipAddress',
          'deviceType',
          'userAgent',
          'refreshToken',
        ],
      });
      if (!oldToken) {
        throw new UnauthorizedException(['token not found']);
      }

      return { refreshToken: oldToken.refreshToken };
    }
    // if (!token) throw new UnauthorizedException(['token not found']);
    // if (!token.user.isActive) {
    //     console.log(".....token user not active");

    //     if (deviceType === "mobile") {
    //         throw new BadRequestException(["token not found"]);
    //     } else {
    //         throw new UnauthorizedException(["token not found"]);
    //     }
    // }

    if (dayjs().isAfter(dayjs(token.refreshExpire), 'm')) {
      await this.tokenService.removeToken(token);
      throw new UnauthorizedException(['token expire']);
    }

    const admin = await this.accountRepo.findOne({
      where: { id: token.userId },
    });

    if (!admin) {
      throw new UnauthorizedException(['admin not found']);
    }

    const { accessToken, refreshToken, accessTokenExpire } =
      await this.tokenService.saveToken(admin, deviceType, token);

    return { accessToken, refreshToken, accessTokenExpire };
  }

  async sendPasswordResetLink(email: string): Promise<{ message: string }> {
    const user = await this.accountRepo.findOneBy({ email });

    // Don't reveal if the user was found or not
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 15); // Token expires in 15 minutes

      user.reset_password_token = token;
      user.reset_password_expires = expires;

      await this.accountRepo.save(user);

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      // Use your email service to send the link
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'パスワードリセットのご案内', // 日本語に修正
        template: 'password-reset', // Using a template
        context: {
          name: user.account_name, // Pass user's name to the template
          link: resetLink,
        },
      });
    }

    return {
      message:
        'そのメールアドレスのアカウントが存在する場合、パスワードリセット用のリンクが送信されました。',
    }; // 日本語に修正
  }

  // async resetPassword(token: string, newPass: string): Promise<AccountEntity> {

  //   console.log(token, newPass, "........resetPassword")

  //   const user = await this.accountRepo.findOne({
  //     where: {
  //       reset_password_token: token,
  //     },
  //   });

  //   console.log(user, "........user in resetPassword")
  //   if (user?.reset_password_expires && dayjs().isAfter(dayjs(user.reset_password_expires), 'm')) {
  //     throw new BadRequestException(
  //       'パスワードリセット用のトークンが無効か、有効期限が切れています。', // 日本語に修正
  //     );
  //   }

  //   if (!user) {
  //     throw new BadRequestException(
  //       'パスワードリセット用のトークンが無効か、有効期限が切れています。',
  //     ); // 日本語に修正
  //   }

  //   // Hash the new password
  //   const salt = await bcrypt.genSalt();
  //   user.password = await bcrypt.hash(newPass, salt);

  //   // Invalidate the token
  //   user.reset_password_token = null;
  //   user.reset_password_expires = null;

  //   return this.accountRepo.save(user);
  // }

async resetPassword(
  token: string,
  newPass: string,
): Promise<{ message: string }> {
  const user = await this.accountRepo.findOne({
    where: {
      reset_password_token: token,
    },
  });

  if (!user) {
    throw new BadRequestException(
      'パスワードリセット用のトークンが無効か、有効期限が切れています。',
    );
  }

  console.log('Now:', dayjs().format());
  console.log(
    'Expire:',
    dayjs(user.reset_password_expires).format(),
  );

  if (
    user.reset_password_expires &&
    dayjs().isAfter(dayjs(user.reset_password_expires))
  ) {
    throw new BadRequestException(
      'パスワードリセット用のトークンが無効か、有効期限が切れています。',
    );
  }

  const hashedPassword = await bcrypt.hash(newPass, 10);

  await this.accountRepo.update(user.id, {
    password: hashedPassword,
    reset_password_token: null,
    reset_password_expires: null,
  });

  return {
    message: 'Password reset successful',
  };
}
}
