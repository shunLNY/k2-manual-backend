import * as bcrypt from 'bcrypt';
import { generateId } from '../../common/service/helper.service';
import {
  AccountEntity,
  AccountRole,
} from '../../modules/accounts/entities/account.entity';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // Number of salt rounds to generate

  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);

  return hashedPassword;
}

export async function AccountSeed(): Promise<Partial<AccountEntity>[]> {
  return [
    {
      id: generateId(),
      account_id: 'ADM001',
      account_name: 'Htet Htet Khine',
      email: 'htethtet@o-technique-myanmar.com',
      role: AccountRole.ADMIN,
      password: await hashPassword('root123'),
    },
    {
      id: generateId(),
      account_id: 'ADM002',
      account_name: 'Shun lae Nay Yee',
      email: 'shunlae@o-technique-myanmar.com',
      role: AccountRole.ADMIN,
      password: await hashPassword('root123'),
    },
    {
      id: generateId(),
      account_name: 'seki',
      account_id: 'ADM003',
      email: 'admin3@gmail.com',
      role: AccountRole.ADMIN,
      password: await hashPassword('root123'),
    },
  ];
}
