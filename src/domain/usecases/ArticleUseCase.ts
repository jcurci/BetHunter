import { Article } from '../entities/Article';
import { ArticleRepository } from '../repositories/ArticleRepository';

export class ArticleUseCase {
  constructor(private articleRepository: ArticleRepository) {}

  async getArticles(): Promise<Article[]> {
    return await this.articleRepository.getArticles();
  }

  async getArticlesByCategory(category: string): Promise<Article[]> {
    return await this.articleRepository.getArticlesByCategory(category);
  }

  async getArticleById(id: string): Promise<Article | null> {
    return await this.articleRepository.getArticleById(id);
  }
} 