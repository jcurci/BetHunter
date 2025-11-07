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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ModalProps, ButtonConfig, HeaderAction } from './Modal.types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SIZE_HEIGHTS = {
  bigger: SCREEN_HEIGHT * 0.9,
  big: SCREEN_HEIGHT * 0.7,
  medium: SCREEN_HEIGHT * 0.5,
  small: SCREEN_HEIGHT * 0.3,
};

const GRADIENT_COLORS = ["#443570", "#443045", "#2F2229", "#1A1923", "#000000"];
const GRADIENT_LOCATIONS = [0, 0.15, 0.32, 0.62, 1];

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

  // TODO: Usar componente Button comum ao invés dessa implementação
  // const renderButton = (button: ButtonConfig, index: number) => {
  //   return <Button key={index} {...button} />;
  // };

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
        {/* Background Gradient */}
        <LinearGradient
          colors={GRADIENT_COLORS}
          locations={GRADIENT_LOCATIONS}
          start={{ x: 0.25, y: 0 }}
          end={{ x: 0.75, y: 1 }}
          style={styles.backgroundGradient}
        />

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
        {/* TODO: Implementar com componente Button comum
        {buttons && buttons.length > 0 && (
          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => (
              <Button key={index} {...button} />
            ))}
          </View>
        )}
        */}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 80,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
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
  // TODO: Remover estilos de botões quando usar componente Button comum
  buttonsContainer: {
    padding: 20,
    paddingTop: 12,
    gap: 12,
  },
  // button: {
  //   height: 56,
  //   borderRadius: 28,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   paddingHorizontal: 24,
  // },
  // buttonPrimary: {
  //   backgroundColor: '#FF6B9D',
  // },
  // buttonSecondary: {
  //   backgroundColor: 'transparent',
  //   borderWidth: 1.5,
  //   borderColor: '#FFFFFF',
  // },
  // buttonDanger: {
  //   backgroundColor: '#FF4444',
  // },
  // buttonGhost: {
  //   backgroundColor: 'transparent',
  // },
  // buttonDisabled: {
  //   backgroundColor: '#2A2733',
  //   opacity: 0.5,
  // },
  // buttonText: {
  //   fontSize: 16,
  //   fontWeight: '600',
  // },
  // buttonTextPrimary: {
  //   color: '#FFFFFF',
  // },
  // buttonTextSecondary: {
  //   color: '#FFFFFF',
  // },
  // buttonTextDanger: {
  //   color: '#FFFFFF',
  // },
  // buttonTextGhost: {
  //   color: '#FFFFFF',
  // },
  // buttonTextDisabled: {
  //   color: '#666666',
  // },
  // buttonIconLeft: {
  //   marginRight: 8,
  // },
  // buttonIconRight: {
  //   marginLeft: 8,
  // },
});

export default CustomModal;

