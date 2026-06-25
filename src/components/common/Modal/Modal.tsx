import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ModalProps, ButtonConfig, HeaderAction } from './Modal.types';
import {
  BACKGROUND_GRADIENT_COLORS,
  BACKGROUND_GRADIENT_LOCATIONS,
  SHADOW_OVERLAY_COLORS,
} from '../../../config/colors';

const SIZE_RATIOS = {
  bigger: 0.9,
  big: 0.7,
  medium: 0.5,
  small: 0.45,
  smaller: 0.2,
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
  scrollEnabled = true,
}) => {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
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
          toValue: screenHeight,
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

  const modalHeight = screenHeight * SIZE_RATIOS[size];
  // Garante que o conteúdo scrollável não fique atrás da nav bar/home indicator
  const contentBottomPadding = Math.max(insets.bottom, 16);

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
          { maxHeight: modalHeight },
          animationType === 'slide'
            ? { transform: [{ translateY: slideAnim }] }
            : { opacity: fadeAnim },
        ]}
      >
        {/* Background Base - Dark */}
        <View style={[styles.backgroundGradient, { backgroundColor: '#000000' }]} />
        
        {/* Radial Effect - Simulated with overlapping gradients */}
        {/* Vertical gradient from top center */}
        <LinearGradient
          colors={BACKGROUND_GRADIENT_COLORS}
          locations={BACKGROUND_GRADIENT_LOCATIONS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.backgroundGradient}
        />
        
        {/* Left shadow overlay */}
        <LinearGradient
          colors={SHADOW_OVERLAY_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.backgroundGradient}
        />
        
        {/* Right shadow overlay */}
        <LinearGradient
          colors={SHADOW_OVERLAY_COLORS}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.backgroundGradient}
        />

        {/* Handle Bar for smaller modals */}
        {size === 'smaller' && (
          <View style={styles.handleBar} />
        )}

        {/* Header */}
        <View style={[styles.header, size === 'smaller' && styles.headerSmaller]}>
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

          {/* Center - Title only */}
          <View style={[styles.headerCenter, size === 'smaller' && styles.headerCenterSmaller]}>
            {title && <Text style={styles.title}>{title}</Text>}
          </View>

          {/* Right Actions — minWidth mirrors close button when right is empty, keeping center symmetric */}
          <View style={[styles.headerRight, showCloseButton && !headerActions?.right?.length && styles.headerRightPhantom]}>
            {headerActions?.right?.map(renderHeaderAction)}
          </View>
        </View>

        {/* Content */}
        {scrollEnabled ? (
          <ScrollView
            style={styles.contentContainer}
            contentContainerStyle={[styles.contentInner, { paddingBottom: contentBottomPadding }]}
            showsVerticalScrollIndicator={false}
          >
            {subtitle && (
              <Text style={[styles.subtitle, styles.subtitleScroll]}>{subtitle}</Text>
            )}
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.contentContainer, { paddingBottom: contentBottomPadding }]}>
            {subtitle && (
              <View style={styles.subtitleCenter}>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
            )}
            <View style={styles.contentInnerBottom}>
              {children}
            </View>
          </View>
        )}

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
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
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
    alignItems: 'center',
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
  /** Centro entre botões laterais — fluxo normal para título multilinha não sobrepor o ScrollView */
  headerCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  headerCenterSmaller: {
    position: 'relative',
    top: 0,
    paddingHorizontal: 20,
    flex: 1,
  },
  headerSmaller: {
    paddingTop: 16,
    paddingBottom: 12,
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  headerRightPhantom: {
    minWidth: 48,
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
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    width: '100%',
    flexShrink: 1,
    lineHeight: 25,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A3AE',
    textAlign: 'center',
    width: '100%',
    flexShrink: 1,
    lineHeight: 21,
  },
  subtitleScroll: {
    marginBottom: 16,
  },
  subtitleCenter: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  contentContainer: {
    flexShrink: 1,
  },
  contentInner: {
    padding: 20,
    flexGrow: 1,
  },
  contentInnerBottom: {
    paddingHorizontal: 20,
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

