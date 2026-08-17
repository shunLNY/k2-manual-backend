import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { BaseController } from '../../common/controller/base.controller';
import { Serialize } from '../../common/interceptor/serialize.interceptor';
import { PaginateAccountDto } from './dto/paginate-account.dto';
import { AccountEntity } from './entities/account.entity';
import { PaginateAccountSerialize } from './serialize/paginate.serializer';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin/accounts')
@UseGuards(AuthGuard('jwt'))
export class AccountsController extends BaseController {
  constructor(private readonly accountsService: AccountsService) {
    super();
  }

  @Post()
  async create(@Body() dto: CreateAccountDto) {
    const data = await this.accountsService.create(dto);
    return this.response(data);
  }
  
  @Get()
  async findAll() {
    const data = await this.accountsService.findAll();
    return this.response(data);
  }

  @Get('/paginate')
  @Serialize(PaginateAccountSerialize)
  async paginateAccounts(@Query() query: PaginateAccountDto, @AuthUser() user: AccountEntity,) {
    const { items, meta } = await this.accountsService.paginateAccounts(query , user);
    return this.paginateResponse(items, meta);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const accountInfo = await this.accountsService.findOne(id);
    return this.response(accountInfo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    const data = await this.accountsService.update(id, dto);
    return this.response(data);
  }

  @Put('/my-profile/:id')
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    const data = await this.accountsService.updateProfile(id, dto);
    return this.response(data);
  }


  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.accountsService.deleteAccount(id);
    return this.response(data);
  }
}
