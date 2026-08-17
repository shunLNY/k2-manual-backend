import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AccountsService } from '../../accounts/accounts.service';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @Inject(AccountsService) private accountService: AccountsService,
    // @Inject(UsersService) private userService: UsersService,
  ) {
    super(configService.get('jwt.decode'));
  }

  async validate(request: any, payload: any) {
    const admin = await this.accountService.repo.findOne({
      where: { email: payload.email },
      select: ['id', 'email', 'account_name'],
      cache: {
        id: `admin_${payload.id}`,
        milliseconds: 500,
      },
    });

    const loginUser = await this.accountService.repo.findOne({
      where: {
        account_name: payload.username,
      },
    });

    if (admin) {
      request.authUser = loginUser;
      return payload;
    }
    throw new UnauthorizedException();
  }
}
