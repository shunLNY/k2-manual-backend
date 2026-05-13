import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetColumnToAccountsTable1778576844565 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(
        'ALTER TABLE `accounts` ' +
        'ADD `reset_password_token` VARCHAR(255) NULL UNIQUE AFTER `password`, ' +
        'ADD `reset_password_expires` TIMESTAMP NULL AFTER `reset_password_token`',
      );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropColumns('accounts', [
      'reset_password_token',
      'reset_password_expires',
    ]);
    }

}
