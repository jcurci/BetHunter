import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import RevenueCatUI from 'react-native-purchases-ui';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../types/navigation';

const CustomerCenter: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <RevenueCatUI.CustomerCenterView
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
