import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useNavigation } from '@react-navigation/native';

const CustomerCenter: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <RevenueCatUI.CustomerCenter
        onDismiss={() => navigation.goBack()}
      />
    </SafeAreaView>
  );
};

export default CustomerCenter;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
});
