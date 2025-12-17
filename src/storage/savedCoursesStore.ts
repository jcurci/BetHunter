import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedCourse {
  id: string;
  title: string;
  progress: string;
  percentage: number;
  gradientColors: string[];
  hasProgress: boolean;
  description?: string;
  stars?: string;
  points?: number;
  savedAt: number;
}

interface SavedCoursesState {
  savedCourses: SavedCourse[];
  addCourse: (course: Omit<SavedCourse, 'savedAt'>) => void;
  removeCourse: (courseId: string) => void;
  isSaved: (courseId: string) => boolean;
  toggleSave: (course: Omit<SavedCourse, 'savedAt'>) => void;
}

export const useSavedCoursesStore = create<SavedCoursesState>()(
  persist(
    (set, get) => ({
      savedCourses: [],
      
      addCourse: (course) => {
        set((state) => ({
          savedCourses: [
            ...state.savedCourses,
            { ...course, savedAt: Date.now() },
          ],
        }));
      },
      
      removeCourse: (courseId) => {
        set((state) => ({
          savedCourses: state.savedCourses.filter((c) => c.id !== courseId),
        }));
      },
      
      isSaved: (courseId) => {
        return get().savedCourses.some((c) => c.id === courseId);
      },
      
      toggleSave: (course) => {
        const { isSaved, addCourse, removeCourse } = get();
        if (isSaved(course.id)) {
          removeCourse(course.id);
        } else {
          addCourse(course);
        }
      },
    }),
    {
      name: 'saved-courses-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);


