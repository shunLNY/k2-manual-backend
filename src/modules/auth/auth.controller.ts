import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, UseGuards, Request, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { BaseController } from 'src/common/controller/base.controller';
import { AccountsService } from '../accounts/accounts.service';
import { AuthGuard } from '@nestjs/passport';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController extends BaseController {
  constructor(
    private authService: AuthService,
    readonly adminsService: AccountsService,
  ) {
    super();
  }

  @Post('login')
  async login(
    @Body() loginDTO: LoginDto,
    @Headers() headers: any,
    @Ip() ipAddress: any,
  ) {
        console.log("login  HITTTT");

    const { admin, accessToken, refreshToken, accessTokenExpire, } =
      await this.authService.login(loginDTO, headers, ipAddress);

    return this.response(
      admin,
      { title: 'Success!', body: 'login successful.' },
      { accessToken, refreshToken, accessTokenExpire, },
    );
  }

  @Patch("logout")
  async logout(@Headers() headers: any) {
    console.log(headers)
    return this.response(undefined, { title: "Success!", body: "logout successful." });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() request) {
    return { data: request.user };
  }

  // get refresh token
  @Post("/token/new")
  public async getNewToken(@Headers() headers: any) {
    const token = await this.authService.getNewToken(headers);
    return this.response(undefined, { title: "Success!", body: "get new token success" }, token);
  }

  @Post('forget-password')
  async forgotPassword(@Body('email') email: string) {
    // We return a generic success message to prevent email enumeration attacks
    return this.authService.sendPasswordResetLink(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    // Use a DTO for validation
    return this.authService.resetPassword(body.token, body.new_password);
  }
}
