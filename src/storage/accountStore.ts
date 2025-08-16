import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  categoryIcon: string;
  description: string;
  date: Date;
}

interface AccountStore {
  transactions: Transaction[];
  balance: number;
  totalIncome: number;
  totalExpense: number;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  loadTransactions: () => Promise<void>;
  saveTransactions: () => Promise<void>;
}

const STORAGE_KEY = '@BetHunter:transactions';

// Mock data inicial baseado nas imagens
const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 1213.00,
    type: 'expense',
    category: 'Educação',
    categoryIcon: 'school',
    description: 'Mensalidade',
    date: new Date('2024-12-12'),
  },
  {
    id: '2',
    amount: 224.00,
    type: 'expense',
    category: 'Pagamento Digital',
    categoryIcon: 'credit-card',
    description: 'Conta de Luz',
    date: new Date('2024-12-11'),
  },
  {
    id: '3',
    amount: 2182.00,
    type: 'expense',
    category: 'Cartão de Crédito',
    categoryIcon: 'credit-card-outline',
    description: 'Fatura do Cartão',
    date: new Date('2024-12-10'),
  },
  {
    id: '4',
    amount: 3980.00,
    type: 'income',
    category: 'Entradas',
    categoryIcon: 'cash-plus',
    description: 'Entradas Diversas',
    date: new Date('2024-12-10'),
  },
  {
    id: '5',
    amount: 1765.00,
    type: 'expense',
    category: 'Compras',
    categoryIcon: 'shopping',
    description: 'Compras Diversas',
    date: new Date('2024-12-10'),
  },
  {
    id: '6',
    amount: 329.00,
    type: 'expense',
    category: 'Transporte',
    categoryIcon: 'car',
    description: 'Uber',
    date: new Date('2024-12-09'),
  },
  {
    id: '7',
    amount: 8104.00,
    type: 'expense',
    category: 'Pagamento Digital',
    categoryIcon: 'credit-card',
    description: 'Conta de Água',
    date: new Date('2024-12-08'),
  },
  {
    id: '8',
    amount: 5980.00,
    type: 'income',
    category: 'Entradas',
    categoryIcon: 'cash-plus',
    description: 'Entradas Diversas',
    date: new Date('2024-12-08'),
  },
  {
    id: '9',
    amount: 165.00,
    type: 'expense',
    category: 'Compras',
    categoryIcon: 'shopping',
    description: 'Compras Diversas',
    date: new Date('2024-12-07'),
  },
];

export const useAccountStore = create<AccountStore>((set, get) => ({
  transactions: [],
  balance: 0,
  totalIncome: 0,
  totalExpense: 0,

  addTransaction: (transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };

    set((state) => {
      const updatedTransactions = [...state.transactions, newTransaction];
      const totalIncome = updatedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = updatedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncome - totalExpense;

      return {
        transactions: updatedTransactions,
        totalIncome,
        totalExpense,
        balance,
      };
    });

    get().saveTransactions();
  },

  deleteTransaction: (id) => {
    set((state) => {
      const updatedTransactions = state.transactions.filter(t => t.id !== id);
      const totalIncome = updatedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = updatedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncome - totalExpense;

      return {
        transactions: updatedTransactions,
        totalIncome,
        totalExpense,
        balance,
      };
    });

    get().saveTransactions();
  },

  loadTransactions: async () => {
    try {
      const storedTransactions = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (storedTransactions) {
        const transactions: Transaction[] = JSON.parse(storedTransactions).map((t: any) => ({
          ...t,
          date: new Date(t.date),
        }));

        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpense;

        set({
          transactions,
          totalIncome,
          totalExpense,
          balance,
        });
      } else {
        // Se não há dados salvos, usar dados mock
        const totalIncome = mockTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = mockTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpense;

        set({
          transactions: mockTransactions,
          totalIncome,
          totalExpense,
          balance,
        });

        // Salvar dados mock
        await get().saveTransactions();
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  },

  saveTransactions: async () => {
    try {
      const { transactions } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  },
}));
