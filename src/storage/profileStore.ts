import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_IMAGE_KEY = '@BetHunter:profileImage';

interface ProfileStore {
  profileImageUri: string | null;
  setProfileImage: (uri: string | null) => Promise<void>;
  loadProfileImage: () => Promise<void>;
  clearProfileImage: () => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profileImageUri: null,

  setProfileImage: async (uri: string | null) => {
    try {
      if (uri) {
        await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
      } else {
        await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
      }
      set({ profileImageUri: uri });
    } catch (error) {
      console.error('Error saving profile image:', error);
    }
  },

  loadProfileImage: async () => {
    try {
      const uri = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      set({ profileImageUri: uri });
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  },

  clearProfileImage: async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
      set({ profileImageUri: null });
    } catch (error) {
      console.error('Error clearing profile image:', error);
    }
  },
}));



