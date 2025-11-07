import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ModalProps, ButtonConfig, HeaderAction } from './Modal.types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SIZE_HEIGHTS = {
  bigger: SCREEN_HEIGHT * 0.9,
  big: SCREEN_HEIGHT * 0.7,
  medium: SCREEN_HEIGHT * 0.5,
  small: SCREEN_HEIGHT * 0.3,
};

const CustomModal: React.FC<ModalProps> = ({
  visible,
  onClose,
  size = 'medium',
  title,
  subtitle,
  children,
  animationType = 'slide',
  headerActions,
  buttons,
  showCloseButton = true,
  backdropOpacity = 0.5,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (animationType === 'slide') {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }).start();
      } else {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } else {
      if (animationType === 'slide') {
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [visible, animationType]);

  const modalHeight = SIZE_HEIGHTS[size];

  const renderHeaderAction = (action: HeaderAction, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.headerActionButton}
      onPress={action.onPress}
      activeOpacity={0.7}
    >
      <Icon
        name={action.icon}
        size={action.size || 24}
        color={action.color || '#FFFFFF'}
      />
    </TouchableOpacity>
  );

  const renderButton = (button: ButtonConfig, index: number) => {
    const buttonStyle = [
      styles.button,
      button.variant === 'primary' && styles.buttonPrimary,
      button.variant === 'secondary' && styles.buttonSecondary,
      button.variant === 'danger' && styles.buttonDanger,
      button.variant === 'ghost' && styles.buttonGhost,
      button.disabled && styles.buttonDisabled,
      button.customStyle,
    ];

    const textStyle = [
      styles.buttonText,
      button.variant === 'primary' && styles.buttonTextPrimary,
      button.variant === 'secondary' && styles.buttonTextSecondary,
      button.variant === 'danger' && styles.buttonTextDanger,
      button.variant === 'ghost' && styles.buttonTextGhost,
      button.disabled && styles.buttonTextDisabled,
      button.customTextStyle,
    ];

    return (
      <TouchableOpacity
        key={index}
        style={buttonStyle}
        onPress={button.onPress}
        disabled={button.disabled || button.loading}
        activeOpacity={0.8}
      >
        {button.loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            {button.icon && button.iconPosition === 'left' && (
              <Icon
                name={button.icon}
                size={20}
                color={button.variant === 'secondary' ? '#FFFFFF' : '#FFFFFF'}
                style={styles.buttonIconLeft}
              />
            )}
            <Text style={textStyle}>{button.label}</Text>
            {button.icon && button.iconPosition === 'right' && (
              <Icon
                name={button.icon}
                size={20}
                color={button.variant === 'secondary' ? '#FFFFFF' : '#FFFFFF'}
                style={styles.buttonIconRight}
              />
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  const modalContent = (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            styles.backdrop,
            { backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.modalContainer,
          { height: modalHeight },
          animationType === 'slide'
            ? { transform: [{ translateY: slideAnim }] }
            : { opacity: fadeAnim },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Left Actions */}
          <View style={styles.headerLeft}>
            {showCloseButton && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {headerActions?.left?.map(renderHeaderAction)}
          </View>

          {/* Center - Title and Subtitle */}
          <View style={styles.headerCenter}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          {/* Right Actions */}
          <View style={styles.headerRight}>
            {headerActions?.right?.map(renderHeaderAction)}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {/* Buttons */}
        {buttons && buttons.length > 0 && (
          <View style={styles.buttonsContainer}>
            {buttons.map(renderButton)}
          </View>
        )}
      </Animated.View>
    </View>
  );

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {modalContent}
    </RNModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    backgroundColor: '#14121B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#201F2A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2733',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2733',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A3AE',
    textAlign: 'center',
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
  },
  buttonsContainer: {
    padding: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#201F2A',
  },
  button: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonPrimary: {
    backgroundColor: '#FF6B9D',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  buttonDanger: {
    backgroundColor: '#FF4444',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    backgroundColor: '#2A2733',
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    color: '#FFFFFF',
  },
  buttonTextDanger: {
    color: '#FFFFFF',
  },
  buttonTextGhost: {
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#666666',
  },
  buttonIconLeft: {
    marginRight: 8,
  },
  buttonIconRight: {
    marginLeft: 8,
  },
});

export default CustomModal;

