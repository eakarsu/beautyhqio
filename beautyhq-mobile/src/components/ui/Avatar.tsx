import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/utils/colors';
import { getInitials } from '@/utils/helpers';

interface AvatarProps {
  source?: string | null;
  firstName: string;
  lastName?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
}

const sizeMap = {
  small: 32,
  medium: 44,
  large: 64,
  xlarge: 96,
};

const fontSizeMap = {
  small: 12,
  medium: 16,
  large: 24,
  xlarge: 36,
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  firstName,
  lastName,
  size = 'medium',
  style,
}) => {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const initials = getInitials(firstName, lastName);

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[styles.image, containerStyle, style]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View style={[styles.placeholder, containerStyle, style]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.gray[200],
  },
  placeholder: {
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary[700],
    fontWeight: '600',
  },
});

export default Avatar;
