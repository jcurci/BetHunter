import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

const EventCard = ({ event, onPress }: EventCardProps) => {
  return (
    <TouchableOpacity style={styles.eventItem} onPress={onPress}>
      <Text style={styles.eventLocation}>{event.location}</Text>
      <Text style={styles.eventDate}>{event.date}</Text>
      <Text style={styles.eventDuration}>Duração: {event.duration}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  eventItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventLocation: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventDuration: {
    fontSize: 14,
    color: '#666',
  },
});

export default EventCard; 