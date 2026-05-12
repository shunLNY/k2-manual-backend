import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddFieldsToCategories1778231500000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE categories ADD category_slug varchar(255) NOT NULL AFTER category_name`);
    await queryRunner.query(`ALTER TABLE categories ADD parent_category_id varchar(50) NULL AFTER category_slug`);

    await queryRunner.createForeignKey('categories', new TableForeignKey({
        columnNames: ['parent_category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'SET NULL',
    }));
}

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('categories');
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('parent_category_id') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('categories', foreignKey);
        }
        await queryRunner.dropColumns('categories', ['category_slug', 'parent_category_id', 'is_published_or_not']);
    }

}
