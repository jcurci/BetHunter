export type ModuleType = 'MATERIAL' | 'QUIZ' | 'REWARD';

export interface CourseModule {
  id: string;
  title: string;
  moduleNumber: number;
  moduleType: ModuleType;
  courseId: string;
}

export interface CourseModuleApiResponse {
  id: string;
  title: string;
  moduleNumber: number;
  moduleType: ModuleType;
  courseId: string;
}

export const mapCourseModuleFromApi = (api: CourseModuleApiResponse): CourseModule => ({
  id: api.id,
  title: api.title ?? '',
  moduleNumber: api.moduleNumber ?? 0,
  moduleType: api.moduleType,
  courseId: api.courseId,
});
