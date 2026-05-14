// src/modules/articles/serialize/paginate.serializer.ts
import { Expose, Type } from "class-transformer";
import { GetArticleSerializer } from "./get-one-by-id.serializer";

export class PaginateArticleResponse {
  @Expose()
  @Type(() => GetArticleSerializer)
  data: GetArticleSerializer[];

  @Expose()
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}