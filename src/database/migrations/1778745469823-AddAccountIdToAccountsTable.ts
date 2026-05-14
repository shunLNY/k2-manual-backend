import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountIdToAccountsTable1778745469823 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE accounts ADD account_id varchar(50) NOT NULL AFTER email`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('accounts', 'account_id');
  }
}
