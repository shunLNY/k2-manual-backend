import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFileStorageTable1779600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'file_storage',
        columns: [
          {
            name: 'path',
            type: 'varchar',
            length: '512',
            isPrimary: true,
          },
          {
            name: 'data',
            type: 'longblob',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'size',
            type: 'int',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('file_storage', true);
  }
}
