import React from "react";
import Icon from "react-native-vector-icons/Feather";
import CircularIconButton from "./CircularIconButton";

interface IconButtonProps {
  onPress?: () => void;
  size?: number;
}

export const CloseIconButton: React.FC<IconButtonProps> = ({ onPress, size }) => (
  <CircularIconButton onPress={onPress} size={size}>
    <Icon name="x" size={18} color="#FFFFFF" />
  </CircularIconButton>
);

export const HelpIconButton: React.FC<IconButtonProps> = ({ onPress, size }) => (
  <CircularIconButton onPress={onPress} size={size}>
    <Icon name="help-circle" size={18} color="#FFFFFF" />
  </CircularIconButton>
);

export const BackIconButton: React.FC<IconButtonProps> = ({ onPress, size }) => (
  <CircularIconButton onPress={onPress} size={size}>
    <Icon name="arrow-left" size={18} color="#FFFFFF" />
  </CircularIconButton>
);


