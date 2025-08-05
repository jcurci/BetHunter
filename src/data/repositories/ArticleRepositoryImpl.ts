import { Article } from '../../domain/entities/Article';
import { ArticleRepository } from '../../domain/repositories/ArticleRepository';
import { ArticleDataSource } from '../datasources/ArticleDataSource';

export class ArticleRepositoryImpl implements ArticleRepository {
  constructor(private articleDataSource: ArticleDataSource) {}

  async getArticles(): Promise<Article[]> {
    return await this.articleDataSource.getArticles();
  }

  async getArticlesByCategory(category: string): Promise<Article[]> {
    return await this.articleDataSource.getArticlesByCategory(category);
  }

  async getArticleById(id: string): Promise<Article | null> {
    return await this.articleDataSource.getArticleById(id);
  }
} 