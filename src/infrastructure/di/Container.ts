import { StorageService } from '../storage/StorageService';
import { AsyncStorageService } from '../storage/AsyncStorageService';
import { UserDataSource } from '../../data/datasources/UserDataSource';
import { UserDataSourceImpl } from '../datasources/UserDataSourceImpl';
import { RouletteDataSource } from '../../data/datasources/RouletteDataSource';
import { RouletteDataSourceImpl } from '../datasources/RouletteDataSourceImpl';
import { ArticleDataSource } from '../../data/datasources/ArticleDataSource';
import { ArticleDataSourceImpl } from '../datasources/ArticleDataSourceImpl';
import { LessonDataSource } from '../../data/datasources/LessonDataSource';
import { LessonDataSourceImpl } from '../datasources/LessonDataSourceImpl';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { UserRepositoryImpl } from '../../data/repositories/UserRepositoryImpl';
import { RouletteRepository } from '../../domain/repositories/RouletteRepository';
import { RouletteRepositoryImpl } from '../../data/repositories/RouletteRepositoryImpl';
import { ArticleRepository } from '../../domain/repositories/ArticleRepository';
import { ArticleRepositoryImpl } from '../../data/repositories/ArticleRepositoryImpl';
import { LessonRepository } from '../../domain/repositories/LessonRepository';
import { LessonRepositoryImpl } from '../../data/repositories/LessonRepositoryImpl';
import { UserUseCase } from '../../domain/usecases/UserUseCase';
import { RouletteUseCase } from '../../domain/usecases/RouletteUseCase';
import { ArticleUseCase } from '../../domain/usecases/ArticleUseCase';
import { LessonUseCase } from '../../domain/usecases/LessonUseCase';

export class Container {
  private static instance: Container;
  
  // Storage Services
  private storageService!: StorageService;
  
  // Data Sources
  private userDataSource!: UserDataSource;
  private rouletteDataSource!: RouletteDataSource;
  private articleDataSource!: ArticleDataSource;
  private lessonDataSource!: LessonDataSource;
  
  // Repositories
  private userRepository!: UserRepository;
  private rouletteRepository!: RouletteRepository;
  private articleRepository!: ArticleRepository;
  private lessonRepository!: LessonRepository;
  
  // Use Cases
  private userUseCase!: UserUseCase;
  private rouletteUseCase!: RouletteUseCase;
  private articleUseCase!: ArticleUseCase;
  private lessonUseCase!: LessonUseCase;
  
  private constructor() {
    this.initializeServices();
  }
  
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
  
  // Getters públicos
  public getUserUseCase(): UserUseCase {
    return this.userUseCase;
  }
  
  public getRouletteUseCase(): RouletteUseCase {
    return this.rouletteUseCase;
  }
  
  public getArticleUseCase(): ArticleUseCase {
    return this.articleUseCase;
  }
  
  public getLessonUseCase(): LessonUseCase {
    return this.lessonUseCase;
  }
  
  public getStorageService(): StorageService {
    return this.storageService;
  }
  
  // Métodos privados
  private initializeServices(): void {
    try {
      // Storage
      this.storageService = new AsyncStorageService();
      
      // Data Sources
      this.userDataSource = new UserDataSourceImpl(this.storageService);
      this.rouletteDataSource = new RouletteDataSourceImpl();
      this.articleDataSource = new ArticleDataSourceImpl();
      this.lessonDataSource = new LessonDataSourceImpl();
      
      // Repositories
      this.userRepository = new UserRepositoryImpl(this.userDataSource);
      this.rouletteRepository = new RouletteRepositoryImpl(this.rouletteDataSource);
      this.articleRepository = new ArticleRepositoryImpl(this.articleDataSource);
      this.lessonRepository = new LessonRepositoryImpl(this.lessonDataSource);
      
      // Use Cases
      this.userUseCase = new UserUseCase(this.userRepository);
      this.rouletteUseCase = new RouletteUseCase(this.rouletteRepository);
      this.articleUseCase = new ArticleUseCase(this.articleRepository);
      this.lessonUseCase = new LessonUseCase(this.lessonRepository);
    } catch (error) {
      console.error('Erro ao inicializar Container:', error);
      throw error;
    }
  }
}