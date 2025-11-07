import { ViewStyle, TextStyle } from 'react-native';

export type ModalSize = 'bigger' | 'big' | 'medium' | 'small';
export type AnimationType = 'slide' | 'fade';
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface HeaderAction {
  icon: string;
  onPress: () => void;
  color?: string;
  size?: number;
}

export interface HeaderActions {
  left?: HeaderAction[];
  right?: HeaderAction[];
}

export interface ButtonConfig {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  customStyle?: ViewStyle;
  customTextStyle?: TextStyle;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  animationType?: AnimationType;
  headerActions?: HeaderActions;
  buttons?: ButtonConfig[];
  showCloseButton?: boolean;
  backdropOpacity?: number;
}




