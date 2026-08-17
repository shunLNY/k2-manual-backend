import { Injectable } from '@nestjs/common';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import TokenEntity from './entities/token.entity';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountEntity } from '../accounts/entities/account.entity';
import { generateId } from '../../common/service/helper.service';

dayjs.extend(utc);

@Injectable()
export class TokensService {
  readonly repo: Repository<TokenEntity>;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectDataSource()
    private dataSource: DataSource,

  ) {
    this.repo = dataSource.getRepository(TokenEntity);
  }

  public async createToken(admin: AccountEntity, headers: any, ipAddress: string) {
    const { accessToken, refreshToken, accessTokenExpire } =
      this.generateToken(admin);

    const deviceType = headers['x-device-type'];

    const token = await this.repo.findOne({
      where: {
        userId: admin.id,
        ipAddress,
        deviceType,
        userAgent: headers['user-agent'],
      },
      select: ['id', 'userId', 'ipAddress', 'deviceType', 'userAgent'],
    });

    const refreshExpire = this.generateRefreshTokenExpire(deviceType);
    let tokenId: string;
    if (token) {
      const { id } = await this.repo.save({
        ...token,
        refreshToken,
        refreshExpire,
      });
      tokenId = id;
    } else {
      const { id } = await this.repo.save({
        id: generateId(),
        refreshToken,
        refreshExpire,
        userId: admin.id,
        ipAddress,
        deviceType,
        userAgent: headers['user-agent'],
      });
      tokenId = id;
    }

    return { accessToken, refreshToken, accessTokenExpire, tokenId };
  }

  public generateToken(admin: AccountEntity) {
    // const { timezone } = this.configService.get("app");
    let { accessTokenExpire } = this.configService.get('jwt');

    const [expireValue, expireUnit] = accessTokenExpire.split('-');

    const accessToken = this.jwtService.sign({
      id: admin.id,
      username: admin.account_name,
      role : admin.role
    });

    accessTokenExpire = dayjs()
      .add(parseInt(expireValue), expireUnit)
      .utc()
      // .subtract(5, 'minutes')
      .format();

    const refreshToken = this.generateRefreshToken();

    return { accessToken, refreshToken, accessTokenExpire };
  }

  private generateRefreshToken() {
    return randomBytes(38).toString('base64url').slice(0, 50);
  }

  public generateRefreshTokenExpire(deviceType: string) {
    const { pcRefreshTokenExpire, mobileRefreshTokenExpire } =
      this.configService.get('jwt');
    // const { timezone } = this.configService.get("app");

    const [expireValue, expireUnit] =
      deviceType == 'mobile'
        ? mobileRefreshTokenExpire.split('-')
        : pcRefreshTokenExpire.split('-');

    return dayjs().add(parseInt(expireValue), expireUnit).utc().format();
  }

  public async saveToken(
    admin: AccountEntity,
    deviceType: string,
    token: TokenEntity,
  ) {
    const { accessToken, refreshToken, accessTokenExpire } =
      this.generateToken(admin);
    console.log(token, '....save token function');
    const refreshExpire = this.generateRefreshTokenExpire(deviceType);
    console.log(refreshExpire, '....refreshExpire save token function');

    await this.repo.save({
      ...token,
      refreshToken,
      refreshExpire,
    });

    return { accessToken, refreshToken, accessTokenExpire };
  }

  public async removeToken(token: TokenEntity) {
    // await this.accessLogsService.logRepo.delete({
    //   tokenId: token.id,
    // });
    await this.repo.remove(token);
  }

  async findAll() {
    const currentDate = dayjs();
    console.log(currentDate.toDate());
    const data = await this.repo.find({
      where: {
        refreshExpire: MoreThan(currentDate.toDate()),
      },
      relations: ['user'],
    });
    return data;
    // const adminCount = await this.repo.count({
    //   where: {
    //     refreshExpire: MoreThan(currentDate.toDate()),
    //   },
    // });

    // const currentDate = dayjs();

    // const data =  this.repo
    //   .createQueryBuilder('tokens')
    //   .select('refreshExpire')
    //   .addSelect('COUNT(*)', 'count')
    //   .where('refreshExpire > :currentDate', { currentDate: currentDate.toDate() })
    //   .groupBy('refreshExpire')
    //   .getRawMany();

    // return data;
  }
}
