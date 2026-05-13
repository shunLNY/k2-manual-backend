import { CategoriesEntity } from '../../modules/categories/entities/category.entity';
import { DataSource } from 'typeorm';

export const seedCategories = async (dataSource: DataSource) => {
  const categoryRepository = dataSource.getRepository(CategoriesEntity);

  const seedData = [
    {
      id: '11f14d17-c9d3-97f0-bc39-9ff3269bb3b1',
      sort_order: 1,
      status: 'public',
      category_name: 'Technology',
      category_slug: 'technology',
      parent_category_id: null,
      number_of_articles_used: 0,
      creator_id: '11f14d17-c9d3-97f0-bc39-9ff3269bb3b1',
      editor_id: '11f14d17-c9d3-97f0-bc39-9ff3269bb3b1',
    },
    {
      id: '22f14d17-c9d3-97f0-bc39-9ff3269bb3b2',
      sort_order: 2,
      status: 'public',
      category_name: 'Lifestyle',
      category_slug: 'lifestyle',
      parent_category_id: null,
      number_of_articles_used: 0,
      creator_id: '11f14d17-c9d3-97f0-bc39-9ff3269bb3b1',
      editor_id: '11f14d17-c9d3-97f0-bc39-9ff3269bb3b1',
    },
  ];

  for (const data of seedData) {
    const existingCategory = await categoryRepository.findOneBy({
      id: data.id,
    });

    if (!existingCategory) {
      const category = categoryRepository.create(data as any);
      await categoryRepository.save(category);
      console.log(`✅ Category seeded successfully: ${data.category_name}`);
    } else {
      console.log(`ℹ️ Category already exists: ${data.category_name}`);
    }
  }
};
