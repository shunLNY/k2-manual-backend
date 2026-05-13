import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountEntity, AccountRole } from './entities/account.entity';
import { generateId, paginate, Pagination } from 'src/common/service/helper.service';
import { Brackets, DataSource, Repository } from 'typeorm';
import { PaginateAccountDto } from './dto/paginate-account.dto';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class AccountsService {
  public repo: Repository<AccountEntity>
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    this.repo = this.dataSource.getRepository(AccountEntity);
  }

  async create(createAccountDto: CreateAccountDto) {
    const { account_name, password, email, account_id, role } = createAccountDto;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = this.repo.create({
      id: generateId(),
      account_id: account_id,
      account_name: account_name,
      email: email,
      password: hashedPassword,
      role: role || AccountRole.EDITOR, 
    });
    return this.repo.save(newAdmin);
  }

  async paginateAccounts(query: PaginateAccountDto, user: AccountEntity) {
    const { page, limit, keyword, isEditor, isAdmin, account_id } = query;
    const queryBuilder = this.repo.createQueryBuilder('accounts')
      .orderBy('accounts.id', 'DESC')

    if (isEditor || isAdmin) {
      queryBuilder.andWhere(
        new Brackets((q) => {
          if (isEditor) q.where("accounts.role = 'editor'");
          if (isAdmin) q.orWhere("accounts.role = 'admin'");
          return q;
        }),
      );
    }

    if (account_id) {
      queryBuilder.andWhere(
        new Brackets((q) => {
          return q.orWhere('accounts.account_id like:account_id', { account_id: `%${account_id}%` })
        })
      )
    }



    if (keyword) {
      queryBuilder.andWhere(
        new Brackets((q) => {
          return q.orWhere('accounts.account_name like:keyword', { keyword: `%${keyword}%` })
            .orWhere('accounts.email like:keyword', { keyword: `%${keyword}%` })
        })
      )
    }

    if (user?.id) {
      queryBuilder.andWhere('accounts.id != :currentUserId', { currentUserId: user.id });
    }

    const data = (await paginate(queryBuilder, { page: Number(page) || 1, limit: Number(limit) || 10 })) as Pagination
    return data;
  }

  async findAll() {
    const accountInfos = await this.repo.find();
    return accountInfos;
  }

  async findOne(id: string) {
    const accountInfo = await this.repo.findOne({ where: { id } });
    if (!accountInfo) {
      throw new Error('Account not found');
    };

    return accountInfo;
  }

  async update(id: string, dto: UpdateAccountDto) {
    const { account_name, email, account_id, role } = dto;
    console.log(dto, ".........................acount dto")
    const accountInfo = await this.repo.findOne({ where: { id } });

    if (!accountInfo) {
      throw new NotFoundException('Account not found');
    };

    try {
      const updateData: any = {};
      if (account_id) updateData.account_id = account_id;
      if (account_name) updateData.account_name = account_name;
      if (role) updateData.role = role;
      if (email) updateData.email = email;

      return await this.repo.update(id, updateData);


    } catch (error) {
      throw new BadRequestException('Error updating account: ' + error.message);
    }

  }

  async updateProfile(id: string, dto: UpdateAccountDto) {
    const { account_name, email, isEmailEdited } = dto;

    const accountInfo = await this.repo.findOne({ where: { id } });
    // console.log(dto, "............profile dto")
    if (!accountInfo) {
      throw new NotFoundException('Account not found');
    };

    try {
      if (account_name) {
        accountInfo.account_name = account_name
      }
      if (isEmailEdited === true) {
        accountInfo.email = email;
        await this.repo.save(accountInfo);
        console.log(accountInfo)
        return { message: 'Email edited' };
      }

      await this.repo.save(accountInfo);
      console.log(accountInfo)
      return accountInfo;



    } catch (error) {
      throw new BadRequestException('Error updating account: ' + error.message);
    }


  }

  async deleteAccount(id: string) {
    const accountInfo = await this.repo.findOne({ 
      where: { id },
      relations: ['created_categories']
    });

    if (!accountInfo) {
      throw new Error('Account not found');
    };

    if (accountInfo?.created_categories && accountInfo.created_categories.length > 0) {
      throw new Error('Cannot delete account with existing categories');
    } else {
      await this.repo.softDelete(id);
      return { message: 'Account deleted successfully' };
    }
  }
}
