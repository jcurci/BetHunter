export interface CourseProgress {
  id: string;
  title: string;
  description: string;
  userStars: number;
  possibleStars: number;
  betcoins: number;
  modulesQuantity: number;
  modulesCompleted: number;
  moduleCompletionPercentage: number;
}

export interface CourseProgressApiResponse {
  id: string;
  title: string;
  description: string;
  user_stars: number;
  possible_stars: number;
  betcoins: number;
  modules_quantity: number;
  modules_completed: number;
  module_completion_percentage: number;
}

export const mapCourseProgressFromApi = (api: CourseProgressApiResponse): CourseProgress => ({
  id: api.id,
  title: api.title ?? '',
  description: api.description ?? '',
  userStars: api.user_stars ?? 0,
  possibleStars: api.possible_stars ?? 0,
  betcoins: api.betcoins ?? 0,
  modulesQuantity: api.modules_quantity ?? 0,
  modulesCompleted: api.modules_completed ?? 0,
  moduleCompletionPercentage: api.module_completion_percentage ?? 0,
});
