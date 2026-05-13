import { AccountEntity } from '../../modules/accounts/entities/account.entity';
import DataSource from '../../config/data-source'; //for migration
import { AccountSeed } from '../seeds/accounts.seed';
import { seedCategories } from '../seeds/categories.seed';

(async () => {
  console.log('seeding panel data...');
  const dataSource = DataSource;

  try {
    await dataSource.initialize();

    // --- 1. Account များကို Seed လုပ်ခြင်း ---
    const accountsData = await AccountSeed();
    const accountRepository = dataSource.getRepository(AccountEntity);

    for (const data of accountsData) {
      const existingAccount = await accountRepository.findOneBy({
        email: data.email,
      });

      if (!existingAccount) {
        const newAccount = accountRepository.create(data);
        await accountRepository.save(newAccount);
        console.log(`✅ Account seeded successfully: ${data.email}`);
      } else {
        console.log(`ℹ️ Account already exists, skipping: ${data.email}`);
      }
    }

    // --- 2. Category များကို Seed လုပ်ခြင်း (ယခုအသစ်ထပ်ထည့်သည့်အပိုင်း) ---
    console.log('seeding categories data...');
    await seedCategories(dataSource);
  } catch (error) {
    console.log(error);
  } finally {
    console.log('exit!');
    process.exit();
  }
})();
