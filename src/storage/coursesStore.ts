import { create } from 'zustand';
import { Container } from '../infrastructure/di/Container';
import { CourseProgress } from '../domain/entities/CourseProgress';

const TTL = 5 * 60 * 1000;

interface CoursesStore {
  courses: CourseProgress[];
  lastFetched: number | null;
  isLoading: boolean;
  loadCourses: (force?: boolean) => Promise<void>;
  invalidate: () => void;
}

export const useCoursesStore = create<CoursesStore>((set, get) => ({
  courses: [],
  lastFetched: null,
  isLoading: false,

  loadCourses: async (force = false) => {
    const { lastFetched, isLoading } = get();
    const now = Date.now();

    if (!force && lastFetched !== null && now - lastFetched < TTL) {
      return;
    }

    // Evita fetches concorrentes
    if (isLoading) return;

    set({ isLoading: true });
    try {
      const courses = await Container.getInstance()
        .getGetCoursesWithProgressUseCase()
        .execute();
      set({ courses, lastFetched: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },

  invalidate: () => set({ courses: [], lastFetched: null }),
}));

export function selectCurrentCourse(courses: CourseProgress[]): CourseProgress | null {
  const inProgress = courses.find(
    (c) => c.modulesCompleted > 0 && c.moduleCompletionPercentage < 100,
  );
  const notStarted = courses.find((c) => c.modulesCompleted === 0);
  return inProgress ?? notStarted ?? courses[0] ?? null;
}
