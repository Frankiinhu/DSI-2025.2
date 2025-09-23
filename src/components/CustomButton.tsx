import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, ViewStyle, TextStyle } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  backgroundColor,
  textColor,
  style = {},
  textStyle = {},
  variant = 'primary',
  disabled = false,
  size = 'medium',
}) => {
  const getButtonStyle = (): ViewStyle => {
    let baseStyle = styles.button;
    
    // Size variants
    if (size === 'small') baseStyle = { ...baseStyle, ...styles.smallButton };
    if (size === 'large') baseStyle = { ...baseStyle, ...styles.largeButton };
    
    // Color variants
    if (backgroundColor) {
      return { ...baseStyle, backgroundColor };
    }
    
    switch (variant) {
      case 'secondary':
        return { ...baseStyle, ...styles.secondaryButton };
      case 'outline':
        return { ...baseStyle, ...styles.outlineButton };
      default:
        return { ...baseStyle, ...styles.primaryButton };
    }
  };

  const getTextStyle = (): TextStyle => {
    let baseStyle = styles.text;
    
    // Size variants
    if (size === 'small') baseStyle = { ...baseStyle, ...styles.smallText };
    if (size === 'large') baseStyle = { ...baseStyle, ...styles.largeText };
    
    // Color variants
    if (textColor) {
      return { ...baseStyle, color: textColor };
    }
    
    switch (variant) {
      case 'secondary':
        return { ...baseStyle, ...styles.secondaryText };
      case 'outline':
        return { ...baseStyle, ...styles.outlineText };
      default:
        return { ...baseStyle, ...styles.primaryText };
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  primaryButton: {
    backgroundColor: '#5559ff',
  },
  secondaryButton: {
    backgroundColor: '#e9c46a',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5559ff',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#264653',
  },
  outlineText: {
    color: '#2a9d8f',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default CustomButton;