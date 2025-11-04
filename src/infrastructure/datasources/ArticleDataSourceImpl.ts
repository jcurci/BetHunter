import { Article } from '../../domain/entities/Article';
import { ArticleDataSource } from '../../data/datasources/ArticleDataSource';
import { apiClient } from '../../services/api/apiClient';

export class ArticleDataSourceImpl implements ArticleDataSource {
  /**
   * Busca artigos da API
   * Fallback para dados mockados se API falhar
   */
  async getArticles(): Promise<Article[]> {
    try {
      const response = await apiClient.get('/articles');
      console.log('✅ [ArticleDataSource] Artigos carregados da API');
      return response.data;
    } catch (error) {
      console.warn('⚠️ [ArticleDataSource] API indisponível, usando dados mockados');
      
      // Fallback para dados mockados
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      
      return [
        {
          id: '1',
          title: 'Preço do bitcoin hoje: cai para US$ 107,8 mil com anúncios de tarifas de Trump',
          description: 'Preço do bitcoin hoje: cai para US$ 107,8 mil com anúncios de tarifas de Trump',
          imageUrl: 'bitcoin',
          category: 'cryptocurrency',
          publishedAt: now,
          readTime: 3,
          updateAt: now,
          createdAt: yesterday,
        },
        {
          id: '2',
          title: 'Risco fiscal, queda da Selic: o que vai determinar o spread no mercado de crédito',
          description: 'Risco fiscal, queda da Selic: o que vai determinar o spread no mercado de crédito',
          imageUrl: 'moeda',
          category: 'economy',
          publishedAt: yesterday,
          readTime: 5,
          updateAt: yesterday,
          createdAt: twoDaysAgo,
        },
        {
          id: '3',
          title: 'Gestores estão otimistas, projetam Ibovespa acima de 140 mil pontos',
          description: 'Gestores estão otimistas, projetam Ibovespa acima de 140 mil pontos',
          imageUrl: 'grafico',
          category: 'stocks',
          publishedAt: twoDaysAgo,
          readTime: 4,
          updateAt: twoDaysAgo,
          createdAt: twoDaysAgo,
        },
      ];
    }
  }

  async getArticlesByCategory(category: string): Promise<Article[]> {
    try {
      const response = await apiClient.get(`/articles/category/${category}`);
      console.log(`✅ [ArticleDataSource] Artigos da categoria ${category} carregados da API`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ [ArticleDataSource] API indisponível, usando fallback local');
      const articles = await this.getArticles();
      return articles.filter(article => article.category === category);
    }
  }

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const response = await apiClient.get(`/articles/${id}`);
      console.log(`✅ [ArticleDataSource] Artigo ${id} carregado da API`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ [ArticleDataSource] API indisponível, usando fallback local');
      const articles = await this.getArticles();
      return articles.find(article => article.id === id) || null;
    }
  }
} 