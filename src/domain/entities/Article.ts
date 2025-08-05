export interface Article {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  publishedAt: Date;
  readTime: number; // em minutos
} 