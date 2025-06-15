export interface Event {
  id: string;
  location: string;
  duration: string;
  damages: string;
  date: string;
}

export type RootStackParamList = {
  Home: undefined;
  EventDetails: { eventId: string };
  NewEvent: undefined;
  Recommendations: undefined;
}; 