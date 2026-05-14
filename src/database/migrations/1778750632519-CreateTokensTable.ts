import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTokensTable1778750632519 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createTable(
      new Table({
        name: 'tokens',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'refreshToken',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'refreshExpire',
            type: 'datetime',
            isNullable: false,
          },
          {
            name: 'userAgent',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'deviceType',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'datetime',
            isNullable: true,
          },
        ],
      }),
      false,
    );
    queryRunner.clearSqlMemory();
    const userForeignKey = new TableForeignKey({
      columnNames: ['userId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'accounts',
    });

    await queryRunner.createForeignKey('tokens', userForeignKey);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
              await queryRunner.dropTable('tokens')

    }

}
