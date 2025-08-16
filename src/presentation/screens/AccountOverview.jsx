import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
// Removed LinearGradient - using solid colors
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAccountStore } from '../../storage/accountStore';

const { width } = Dimensions.get('window');

const AccountOverview = () => {
  const navigation = useNavigation();
  const { 
    transactions, 
    balance, 
    totalIncome, 
    totalExpense, 
    loadTransactions 
  } = useAccountStore();

  useEffect(() => {
    loadTransactions();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getRecentTransactions = () => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  };

  const getChartData = () => {
    // Gerar dados para os últimos 7 dias
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const dailyBalances = last7Days.map(date => {
      const dayTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.toDateString() === date.toDateString();
      });

      const dayIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dayExpense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return dayIncome - dayExpense;
    });

    // Calcular saldo acumulado
    let cumulativeBalance = balance;
    for (let i = dailyBalances.length - 1; i >= 0; i--) {
      cumulativeBalance -= dailyBalances[i];
      dailyBalances[i] = cumulativeBalance + dailyBalances[i];
    }

    return {
      labels: last7Days.map(date => date.getDate().toString()),
      datasets: [{
        data: dailyBalances.map(balance => balance || 0),
        strokeWidth: 3,
      }],
    };
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Icon 
          name={item.categoryIcon} 
          size={24} 
          color="#8B5CF6" 
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        <Text style={styles.transactionDescription}>{item.description}</Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'income' ? '#10B981' : '#F43F5E' }
      ]}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conta</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Lucros</Text>
                <Text style={[styles.balanceValue, { color: '#10B981' }]}>
                  +{formatCurrency(totalIncome)}
                </Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Gastos</Text>
                <Text style={[styles.balanceValue, { color: '#F43F5E' }]}>
                  -{formatCurrency(totalExpense)}
                </Text>
              </View>
            </View>
            <View style={styles.totalBalanceContainer}>
              <Text style={styles.totalBalanceLabel}>Total</Text>
              <Text style={styles.totalBalanceValue}>
                {formatCurrency(balance)}
              </Text>
            </View>
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Evolução Financeira - Últimos 7 dias</Text>
            <LineChart
              data={getChartData()}
              width={width - 80}
              height={200}
              chartConfig={{
                backgroundColor: '#1C1C1C',
                backgroundGradientFrom: '#1C1C1C',
                backgroundGradientTo: '#1C1C1C',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 12,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#8B5CF6',
                  fill: '#8B5CF6',
                },
                propsForBackgroundLines: {
                  strokeDasharray: '5,5',
                  stroke: '#333',
                  strokeWidth: 1,
                },
                fillShadowGradient: '#8B5CF6',
                fillShadowGradientOpacity: 0.1,
              }}
              bezier
              style={styles.chart}
              withShadow={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withInnerLines={true}
              withOuterLines={false}
            />
          </View>

          {/* Recent Transactions */}
          <View style={styles.historySection}>
            <View style={styles.historySectionHeader}>
              <Text style={styles.historyTitle}>Histórico</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('AccountHistory')}
              >
                <Text style={styles.viewAllText}>Ver histórico completo</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getRecentTransactions()}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('TransactionForm')}
        >
          <View style={styles.fabButton}>
            <Icon name="plus" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F10',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceCard: {
    backgroundColor: '#6B21A8',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalBalanceContainer: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
  },
  totalBalanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  totalBalanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chartContainer: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 12,
    marginLeft: -20,
  },
  historySection: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 100,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#BDBDBD',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AccountOverview;
