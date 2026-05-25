import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDescriptionToArticles1779500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('articles');
    const hasDescription = table?.columns.some((c) => c.name === 'description');

    if (!hasDescription) {
      await queryRunner.addColumn(
        'articles',
        new TableColumn({
          name: 'description',
          type: 'longtext',
          isNullable: true,
        }),
      );

      await queryRunner.query(
        `UPDATE articles SET description = excerpt WHERE description IS NULL AND excerpt IS NOT NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('articles');
    if (table?.columns.some((c) => c.name === 'description')) {
      await queryRunner.dropColumn('articles', 'description');
    }
  }
}
