import { Article } from '../entities/Article';

export interface ArticleRepository {
  getArticles(): Promise<Article[]>;
  getArticlesByCategory(category: string): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | null>;
} 