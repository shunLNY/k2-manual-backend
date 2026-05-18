import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesEntity } from './entities/category.entity';
import { StatusType } from 'src/common/constants';
import { FilterCategoryDto } from './dto/filter-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoriesEntity)
    private readonly categoryRepository: Repository<CategoriesEntity>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoriesEntity> {
    const { parent_category_id, sort_order } = createCategoryDto;

    if (parent_category_id) {
      // 親カテゴリーがあればその親に親があるか、どのくらいあるか確認する
      const parent = await this.categoryRepository.findOne({
        where: { id: parent_category_id },
        relations: [
          'parentCategory', 
          'parentCategory.parentCategory', 
          'parentCategory.parentCategory.parentCategory'
        ],
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }

      // 自分の親のラベルを計算する
      let depth = 1; 
      let current = parent;

      while (current.parentCategory) {
        depth++;
        current = current.parentCategory;
      }

      if (depth >= 4) {
        throw new BadRequestException('Maximum depth of 4 levels reached. You cannot add more sub-categories below this level.');
      }
    }

    // Calculate next sort_order if not provided or is 0
    let nextSortOrder = sort_order;
    if (!nextSortOrder) {
      const query = this.categoryRepository.createQueryBuilder('category');
      if (parent_category_id) {
        query.where('category.parent_category_id = :parentId', { parentId: parent_category_id });
      } else {
        query.where('category.parent_category_id IS NULL');
      }
      const maxSortOrder = await query.select('MAX(category.sort_order)', 'max').getRawOne();
      nextSortOrder = (Number(maxSortOrder?.max) || 0) + 1;
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      sort_order: nextSortOrder,
      creator_id: createCategoryDto.creator_id,
      editor_id: createCategoryDto.editor_id,
    });
    return await this.categoryRepository.save(category);
  }

  async findAll(query: FilterCategoryDto): Promise<any[]> {
    const { 
      keyword,
      is_private,
      is_published,
      start_date,
      end_date,
      creator_name,
      editor_name,
      parent_category_id // FrontendからタブIDを送る必要がある。
    } = query;

    const queryBuilder = this.categoryRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'childLevel2')
      .leftJoinAndSelect('childLevel2.children', 'childLevel3')
      .leftJoinAndSelect('childLevel3.children', 'childLevel4')

      .leftJoinAndSelect('category.creator', 'creator')
      .leftJoinAndSelect('category.editor', 'editor')

      .leftJoinAndSelect('childLevel2.creator', 'childLevel2Creator')
      .leftJoinAndSelect('childLevel2.editor', 'childLevel2Editor')

      .leftJoinAndSelect('childLevel3.creator', 'childLevel3Creator')
      .leftJoinAndSelect('childLevel3.editor', 'childLevel3Editor')

      .leftJoinAndSelect('childLevel4.creator', 'childLevel4Creator')
      .leftJoinAndSelect('childLevel4.editor', 'childLevel4Editor')

      .orderBy('category.sort_order', 'ASC')
      .addOrderBy('childLevel2.sort_order', 'ASC')
      .addOrderBy('childLevel3.sort_order', 'ASC')
      .addOrderBy('childLevel4.sort_order', 'ASC');

    if (parent_category_id) {
      queryBuilder.where('category.parent_category_id = :parent_id', { parent_id: parent_category_id });
    } else {
      queryBuilder.where('category.parent_category_id IS NULL');
    }

    // Keyword Search
    if (keyword) {
      queryBuilder.andWhere(new Brackets((qb) => {
        qb.where('LOWER(category.category_name) LIKE :keyword', { keyword: `%${keyword.toLowerCase()}%` })
          .orWhere('LOWER(childLevel2.category_name) LIKE :keyword', { keyword: `%${keyword.toLowerCase()}%` })
          .orWhere('LOWER(childLevel3.category_name) LIKE :keyword', { keyword: `%${keyword.toLowerCase()}%` })
          .orWhere('LOWER(childLevel4.category_name) LIKE :keyword', { keyword: `%${keyword.toLowerCase()}%` });
      }));
    }

    const categories = await queryBuilder.getMany();
    const mapped = categories.map(category => this.mapCategory(category));

    return this.filterCategoryTree(mapped, {
      is_private: is_private === true || (is_private as any) === 'true',
      is_published: is_published === true || (is_published as any) === 'true',
      keyword,
      start_date,
      end_date,
      creator_name,
      editor_name,
    });
  }

  private filterCategoryTree(categories: any[], filters: any): any[] {
    const hasFilter = 
      filters.is_private || 
      filters.is_published || 
      filters.keyword || 
      filters.start_date || 
      filters.end_date || 
      filters.creator_name || 
      filters.editor_name;

    if (!hasFilter) return categories;

    const matchesFilter = (category: any): boolean => {
      // 1. Status Filter
      if (filters.is_private || filters.is_published) {
        let statusMatches = false;
        if (filters.is_private && category.status === 'private') statusMatches = true;
        if (filters.is_published && category.status === 'public') statusMatches = true;
        if (!statusMatches) return false;
      }

      // 2. Creator Filter
      if (filters.creator_name) {
        const creatorName = category.creator?.account_name || '';
        if (!creatorName.toLowerCase().includes(filters.creator_name.toLowerCase())) {
          return false;
        }
      }

      // 3. Editor Filter
      if (filters.editor_name) {
        const editorName = category.editor?.account_name || '';
        if (!editorName.toLowerCase().includes(filters.editor_name.toLowerCase())) {
          return false;
        }
      }

      // 4. Date Filters
      if (filters.start_date) {
        const categoryDate = new Date(category.createdAt);
        const filterDate = new Date(filters.start_date);
        if (categoryDate < filterDate) return false;
      }
      if (filters.end_date) {
        const categoryDate = new Date(category.createdAt);
        const filterDate = new Date(filters.end_date);
        filterDate.setHours(23, 59, 59, 999); //filter till the end time of of end_date(23hr 59min 59sec 999ms)
        if (categoryDate > filterDate) return false;
      }

      // 5. Keyword Filter
      if (filters.keyword) {
        const categoryName = category.category_name || '';
        if (!categoryName.toLowerCase().includes(filters.keyword.toLowerCase())) {
          return false;
        }
      }

      return true;
    };

    const processCategory = (cat: any): any | null => {
      const filteredChildren = cat.child_categories
        ? cat.child_categories
            .map((child: any) => processCategory(child))
            .filter((child: any) => child !== null)
        : [];

      const selfMatches = matchesFilter(cat);

      if (selfMatches || filteredChildren.length > 0) {
        return {
          ...cat,
          child_categories: filteredChildren,
        };
      }

      return null;
    };

    return categories
      .map((cat: any) => processCategory(cat))
      .filter((cat: any) => cat !== null);
  }

  private mapCategory(category: any) {
    return {
      ...category,
      child_categories: category.children 
        ? category.children.map((child: any) => this.mapCategory(child)) 
        : []
    };
  }

  async findOne(id: string): Promise<CategoriesEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parentCategory', 'children', 'creator', 'editor'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<any> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // Prepare clean update data
    const updateData: any = {};
    
    // Only allow specific fields to be updated and filter out null/undefined
    // for fields that are not allowed to be null.
    const fieldsToProcess = Object.keys(updateCategoryDto);
    
    fieldsToProcess.forEach(key => {
      const value = updateCategoryDto[key];
      
      // Never update creator_id or id
      if (key === 'creator_id' || key === 'id') return;

      if (value === undefined || value === null) {
        // parent_category_id is the only one allowed to be null
        if (key === 'parent_category_id') {
          updateData[key] = null;
        }
        // Skip other null/undefined values to prevent ER_BAD_NULL_ERROR
        return;
      }

      updateData[key] = value;
    });

    const updatedCategory = Object.assign(category, updateData);
    const saved = await this.categoryRepository.save(updatedCategory);
    return this.mapCategory(saved);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.softRemove(category);
  }

  async findRoots(): Promise<any[]> {
    const categories = await this.categoryRepository.find({
      where: { parent_category_id: IsNull() },
      order: { sort_order: 'ASC' },
    });
    return categories.map(category => this.mapCategory(category));
  }

  async findActiveCategories(): Promise<any[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'children', 'children.status = :status', { status: StatusType.PUBLIC })
      .leftJoinAndSelect('children.children', 'grandchildren', 'grandchildren.status = :status', { status: StatusType.PUBLIC })
      .leftJoinAndSelect('grandchildren.children', 'greatGrandchildren', 'greatGrandchildren.status = :status', { status: StatusType.PUBLIC })
      .where('category.parent_category_id IS NULL')
      .andWhere('category.status = :status', { status: StatusType.PUBLIC })
      .orderBy('category.sort_order', 'ASC')
      .addOrderBy('children.sort_order', 'ASC')
      .getMany();
      
    return categories.map(category => this.mapCategory(category));
  }

  async reorder(ids: string[]): Promise<void> {
    const updatePromises = ids.map((id, index) => {
      return this.categoryRepository.update(id, { sort_order: index + 1 });
    });
    await Promise.all(updatePromises);
  }
}
