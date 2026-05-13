import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { BaseController } from 'src/common/controller/base.controller';
import { Serialize } from 'src/common/interceptor/serialize.interceptor';
import { GetTokenSerialize } from './serialize/get-token.serialize';

@Controller("tokens")
export class TokensController extends BaseController {
    constructor(private service: TokensService) {
        super();
    }

    @Get('/')
    @Serialize(GetTokenSerialize)
    async getLogs() {
        const all = await this.service.findAll();
        return this.response(all);
    }

}
