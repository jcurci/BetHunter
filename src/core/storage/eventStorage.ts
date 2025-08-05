import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from '../types';

const STORAGE_KEY = '@power_outage_events';

export const saveEvent = async (event: Event): Promise<void> => {
  try {
    const existingEvents = await getEvents();
    const updatedEvents = [...existingEvents, event];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
  } catch (error) {
    console.error('Erro ao salvar evento:', error);
    throw error;
  }
};

export const getEvents = async (): Promise<Event[]> => {
  try {
    const events = await AsyncStorage.getItem(STORAGE_KEY);
    return events ? JSON.parse(events) : [];
  } catch (error) {
    console.error('Erro ao recuperar eventos:', error);
    return [];
  }
};

export const removeEvent = async (eventId: string): Promise<void> => {
  try {
    const events = await getEvents();
    const updatedEvents = events.filter(event => event.id !== eventId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
  } catch (error) {
    console.error('Erro ao remover evento:', error);
    throw error;
  }
}; 