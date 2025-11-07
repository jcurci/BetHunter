import { Container } from './Container';
import { UserUseCase } from '../../domain/usecases/UserUseCase';
import { RouletteUseCase } from '../../domain/usecases/RouletteUseCase';
import { ArticleUseCase } from '../../domain/usecases/ArticleUseCase';
import { LessonUseCase } from '../../domain/usecases/LessonUseCase';

/**
 * Hooks personalizados para Dependency Injection
 * Reduzem acoplamento nas telas ao encapsular acesso ao Container
 */

/**
 * Hook para obter UserUseCase
 */
export const useUserUseCase = (): UserUseCase => {
  const container = Container.getInstance();
  return container.getUserUseCase();
};

/**
 * Hook para obter RouletteUseCase
 */
export const useRouletteUseCase = (): RouletteUseCase => {
  const container = Container.getInstance();
  return container.getRouletteUseCase();
};

/**
 * Hook para obter ArticleUseCase
 */
export const useArticleUseCase = (): ArticleUseCase => {
  const container = Container.getInstance();
  return container.getArticleUseCase();
};

/**
 * Hook para obter LessonUseCase
 */
export const useLessonUseCase = (): LessonUseCase => {
  const container = Container.getInstance();
  return container.getLessonUseCase();
};

/**
 * Hook para obter Container completo
 * Use apenas quando precisar de múltiplos use cases
 */
export const useContainer = (): Container => {
  return Container.getInstance();
};







