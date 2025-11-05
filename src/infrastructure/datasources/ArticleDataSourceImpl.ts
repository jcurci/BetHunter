import { Article } from '../../domain/entities/Article';
import { ArticleDataSource } from '../../data/datasources/ArticleDataSource';

export class ArticleDataSourceImpl implements ArticleDataSource {
  async getArticles(): Promise<Article[]> {
    return [
      {
        id: '1',
        title: 'Preço do bitcoin hoje: cai para US$ 107,8 mil com anúncios de tarifas de Trump',
        description: 'Preço do bitcoin hoje: cai para US$ 107,8 mil com anúncios de tarifas de Trump',
        imageUrl: 'bitcoin',
        category: 'cryptocurrency',
        publishedAt: new Date(),
        readTime: 3,
      },
      {
        id: '2',
        title: 'Risco fiscal, queda da Selic: o que vai determinar o spread no mercado de crédito',
        description: 'Risco fiscal, queda da Selic: o que vai determinar o spread no mercado de crédito',
        imageUrl: 'moeda',
        category: 'economy',
        publishedAt: new Date(),
        readTime: 5,
      },
      {
        id: '3',
        title: 'Gestores estão otimistas, projetam Ibovespa acima de 140 mil pontos',
        description: 'Gestores estão otimistas, projetam Ibovespa acima de 140 mil pontos',
        imageUrl: 'grafico',
        category: 'stocks',
        publishedAt: new Date(),
        readTime: 4,
      },
    ];
  }

  async getArticlesByCategory(category: string): Promise<Article[]> {
    const articles = await this.getArticles();
    return articles.filter(article => article.category === category);
  }

  async getArticleById(id: string): Promise<Article | null> {
    const articles = await this.getArticles();
    return articles.find(article => article.id === id) || null;
  }
} 