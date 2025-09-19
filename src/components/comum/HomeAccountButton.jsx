import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native';
// Removed LinearGradient - using solid colors
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const HomeAccountButton = () => {
  const navigation = useNavigation();
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    navigation.navigate('AccountOverview');
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.touchable}
      >
        <View style={styles.buttonContainer}>
          <Icon name="chart-line" size={20} color="#fff" />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Gestão Financeira</Text>
            <Text style={styles.sub}>Controle suas finanças</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  touchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonContainer: {
    backgroundColor: '#6B21A8',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
  },
  sub: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    fontWeight: '500',
  },
});

export default HomeAccountButton;
