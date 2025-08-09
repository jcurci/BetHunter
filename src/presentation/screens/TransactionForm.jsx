import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
// Removed LinearGradient - using solid colors
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAccountStore } from '../../storage/accountStore';

const categories = [
  // Receitas
  { id: '1', name: 'Salário', icon: 'cash', type: 'income' },
  { id: '2', name: 'Freelance', icon: 'laptop', type: 'income' },
  { id: '3', name: 'Investimentos', icon: 'trending-up', type: 'income' },
  { id: '4', name: 'Vendas', icon: 'sale', type: 'income' },
  { id: '5', name: 'Prêmios', icon: 'trophy', type: 'income' },
  { id: '6', name: 'Outros', icon: 'cash-plus', type: 'income' },
  // Despesas
  { id: '7', name: 'Educação', icon: 'school', type: 'expense' },
  { id: '8', name: 'Transporte', icon: 'car', type: 'expense' },
  { id: '9', name: 'Alimentação', icon: 'food', type: 'expense' },
  { id: '10', name: 'Saúde', icon: 'medical-bag', type: 'expense' },
  { id: '11', name: 'Entretenimento', icon: 'movie', type: 'expense' },
  { id: '12', name: 'Compras', icon: 'shopping', type: 'expense' },
  { id: '13', name: 'Contas', icon: 'receipt', type: 'expense' },
  { id: '14', name: 'Cartão', icon: 'credit-card-outline', type: 'expense' },
  { id: '15', name: 'Casa', icon: 'home', type: 'expense' },
  { id: '16', name: 'Outros', icon: 'dots-horizontal', type: 'expense' },
];

const TransactionForm = () => {
  const navigation = useNavigation();
  const { addTransaction } = useAccountStore();
  
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [date] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (value) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/[^\d]/g, '');
    
    // Converte para número e divide por 100 para ter centavos
    const numberValue = parseFloat(numericValue) / 100;
    
    // Formata como moeda
    if (isNaN(numberValue)) return '';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numberValue);
  };

  const handleAmountChange = (value) => {
    const formatted = formatCurrency(value);
    setAmount(formatted);
  };

  const getNumericAmount = () => {
    const numericValue = amount.replace(/[^\d]/g, '');
    return parseFloat(numericValue) / 100;
  };

  const getFilteredCategories = () => {
    return categories.filter(category => 
      category.type === type || category.type === 'both'
    );
  };

  const handleSubmit = async () => {
    const numericAmount = getNumericAmount();
    
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }
    
    if (!selectedCategory) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Erro', 'Digite uma descrição');
      return;
    }

    setIsLoading(true);

    try {
      addTransaction({
        amount: numericAmount,
        type,
        category: selectedCategory.name,
        categoryIcon: selectedCategory.icon,
        description: description.trim(),
        date,
      });

      Alert.alert(
        'Sucesso',
        'Transação adicionada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('AccountHistory'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a transação');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTypeButton = (buttonType, label) => (
    <TouchableOpacity
      onPress={() => {
        setType(buttonType);
        setSelectedCategory(null); // Reset category when changing type
      }}
      style={[
        styles.typeButton,
        type === buttonType && styles.typeButtonActive
      ]}
    >
      {type === buttonType ? (
        <View style={styles.typeButtonActiveContainer}>
          <Text style={styles.typeButtonTextActive}>{label}</Text>
        </View>
      ) : (
        <Text style={styles.typeButtonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  const renderCategoryItem = (category) => (
    <TouchableOpacity
      key={category.id}
      onPress={() => setSelectedCategory(category)}
      style={[
        styles.categoryItem,
        selectedCategory?.id === category.id && styles.categoryItemActive
      ]}
    >
      <View style={[
        styles.categoryIcon,
        selectedCategory?.id === category.id && styles.categoryIconActive
      ]}>
        <Icon 
          name={category.icon} 
          size={24} 
          color={selectedCategory?.id === category.id ? '#FFFFFF' : '#8B5CF6'}
        />
      </View>
      <Text style={[
        styles.categoryText,
        selectedCategory?.id === category.id && styles.categoryTextActive
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Histórico</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valor</Text>
            <View style={styles.amountContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="R$ 0,00"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Gasto</Text>
            <View style={styles.typeContainer}>
              {renderTypeButton('expense', 'Despesa')}
              {renderTypeButton('income', 'Receita')}
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <View style={styles.categoriesGrid}>
              {getFilteredCategories().map(renderCategoryItem)}
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Compras diversas"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.addButton, isLoading && styles.addButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <View style={styles.addButtonContainer}>
            <Text style={styles.addButtonText}>
              {isLoading ? 'Salvando...' : 'Adicionar'}
            </Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  amountContainer: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 16,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: 'transparent',
    backgroundColor: '#8B5CF6',
  },
  typeButtonActiveContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#BDBDBD',
  },
  typeButtonTextActive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '22%',
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  categoryItemActive: {
    borderColor: '#8B5CF6',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconActive: {
    backgroundColor: '#8B5CF6',
  },
  categoryText: {
    fontSize: 10,
    color: '#BDBDBD',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  descriptionInput: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  addButton: {
    marginBottom: 20,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6B21A8',
  },
  addButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  addButtonContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TransactionForm;
