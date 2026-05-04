import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RevenueCatUI from 'react-native-purchases-ui';
import { useSubscriptionStore } from '../../storage/subscriptionStore';
import type { RootStackParamList } from '../../types/navigation';

const Paywall: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const refresh = useSubscriptionStore((s) => s.refresh);

  const finishAsSubscriber = async (): Promise<void> => {
    await refresh();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onPurchaseCompleted={async () => {
          await finishAsSubscriber();
        }}
        onRestoreCompleted={async () => {
          await finishAsSubscriber();
        }}
      />
    </View>
  );
};

export default Paywall;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
});
