import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '@/utils/colors';
import { AppointmentStatus } from '@/types';
import { getStatusColor, getStatusLabel } from '@/utils/helpers';

interface BadgeProps {
  label?: string;
  status?: AppointmentStatus;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'status';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  status,
  variant = 'default',
  size = 'medium',
  style,
}) => {
  const displayLabel = status ? getStatusLabel(status) : label;
  const statusColor = status ? getStatusColor(status) : undefined;

  const containerStyles: ViewStyle[] = [
    styles.base,
    size === 'small' ? styles.small : styles.medium,
    variant !== 'status' && styles[variant],
    status && { backgroundColor: `${statusColor}20` },
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    size === 'small' ? styles.smallText : styles.mediumText,
    variant !== 'status' && styles[`${variant}Text`],
    status && { color: statusColor },
  ];

  return (
    <View style={containerStyles}>
      <Text style={textStyles}>{displayLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 20,
  },

  // Sizes
  small: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  medium: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },

  // Variants
  default: {
    backgroundColor: colors.gray[100],
  },
  success: {
    backgroundColor: colors.success.light,
  },
  warning: {
    backgroundColor: colors.warning.light,
  },
  error: {
    backgroundColor: colors.error.light,
  },
  info: {
    backgroundColor: colors.info.light,
  },

  // Text styles
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 11,
  },
  mediumText: {
    fontSize: 13,
  },

  // Text variants
  defaultText: {
    color: colors.text.secondary,
  },
  successText: {
    color: colors.success.dark,
  },
  warningText: {
    color: colors.warning.dark,
  },
  errorText: {
    color: colors.error.dark,
  },
  infoText: {
    color: colors.info.dark,
  },
});

export default Badge;
