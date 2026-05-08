import { AccountEntity } from "../../modules/accounts/entities/account.entity";
import DataSource from "../../config/data-source"; //for migration
import { AccountSeed } from "../seeds/accounts.seed";




(async () => {
    console.log('seeding panel data...');
    const dataSource = DataSource;

    try {
        await dataSource.initialize();
        const account = await AccountSeed();


        await Promise.all([
            await dataSource.getRepository(AccountEntity).save(account),

        ]);
        // await runSeeders(dataSource);
    } catch (error) {
        console.log(error);
    } finally {
        console.log('exit!');
        process.exit();
    }
})();