import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateArticlesTable1778231208756 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createTable(
        new Table({
          name: 'articles',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '50',
              isPrimary: true,
              generationStrategy: 'uuid',
            },
            {
              name: 'category_id',
              type: 'varchar',
              length: '50',
            },
            {
              name: 'title',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'content',
              type: 'longtext',
            },
            {
              name: 'excerpt',
              type: 'longtext',
            },
            {
              name: 'thumbnail_path',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'status',
              type: 'enum',
              enum: ['public', 'private'],
              default: '"public"',
              isNullable: false,
            },
            {
              name: 'published_start_at',
              type: 'datetime',
              isNullable: false,
            },
            {
              name: 'published_end_at',
              type: 'datetime',
              isNullable: true,
            },
            {
              name: 'creator_id',
              type: 'varchar',
              length: '50',
            },
            {
              name: 'editor_id',
              type: 'varchar',
              length: '50',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'deleted_at',
              type: 'timestamp',
              isNullable: true,
            },
          ],
          foreignKeys: [
            {
              columnNames: ['category_id'],
              referencedTableName: 'categories',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              columnNames: ['creator_id'],
              referencedTableName: 'accounts',
              referencedColumnNames: ['id'],
            },
            {
              columnNames: ['editor_id'],
              referencedTableName: 'accounts',
              referencedColumnNames: ['id'],
            },
          ],
        })
      )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropTable('articles');
    }

}
