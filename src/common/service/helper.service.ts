import dayjs from 'dayjs';
import { v1 as uuidv1 } from 'uuid';
import * as generator from 'generate-password';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export const generateId = () => {
  return uuidv1().replace(/^(.{4})(.{4})-(.{4})-(.{4})/, '$4$3-$1-$2');
};

export const formatDate = (date: Date, format?: string) => {
  return dayjs(date).format(format || 'YYYY-MM-DD');
};



export const generatePassword = () => {
  return generator.generate({
    length: 8,
    numbers: true,
  });
};

// minutes into HH:mm
export const timeConvert = (n: number | string): string => {
  const num = Number(n);
  const hours = num / 60;
  const rhours = Math.floor(hours);
  const minutes = (hours - rhours) * 60;
  const rminutes = Math.round(minutes);
  return (
    rhours.toString().padStart(2, '0') +
    ':' +
    rminutes.toString().padStart(2, '0')
  );
};

// paginate

export interface Pagination {
  items: ObjectLiteral[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export const paginate = async (
  queryBuilder: SelectQueryBuilder<ObjectLiteral>,
  options: {
    page: number;
    limit: number;
  } = {
      page: 1,
      limit: 50,
    },
): Promise<Pagination> => {

  const totalItems = await queryBuilder.getCount();
  const items = await queryBuilder
    .take(options.limit)
    .skip((options.page - 1) * options.limit)
    .getMany();

  const itemCount = items.length;

  return {
    items,
    meta: {
      totalItems,
      itemCount,
      itemsPerPage: options.limit,
      totalPages:
        totalItems <= options.limit ? 1 : Math.ceil(totalItems / options.limit),
      currentPage: options.page,
    },
  };
};
