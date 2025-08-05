import { Article } from '../../domain/entities/Article';

export interface ArticleDataSource {
  getArticles(): Promise<Article[]>;
  getArticlesByCategory(category: string): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | null>;
} 