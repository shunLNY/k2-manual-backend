import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateCategoriesTable1778230640240 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createTable(
        new Table({
          name: 'categories',
          columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '50',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'sort_order',
            type: 'int',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['public', 'private'],
            default: '"public"',
            isNullable: false,
          },
          {
            name: 'category_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'number_of_articles_used',
            type: 'int',
            isNullable: false,
            default: 0,
          },
          {
            name: 'creator_id',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'editor_id',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        })
      )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
