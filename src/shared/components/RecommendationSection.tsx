import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RecommendationSectionProps {
  title: string;
  items: string[];
}

const RecommendationSection = ({ title, items }: RecommendationSectionProps) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.itemContainer}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.itemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 16,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  itemText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
});

export default RecommendationSection; 