import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors } from '../../theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost';

export function AppButton(props: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle;
}): React.JSX.Element {
  const variant = props.variant ?? 'primary';
  const c = colors.light;

  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? { backgroundColor: c.primary } : undefined,
        variant === 'secondary' ? { backgroundColor: c.primaryMuted, borderWidth: 1, borderColor: c.border } : undefined,
        variant === 'ghost' ? { backgroundColor: 'transparent' } : undefined,
        pressed && !props.disabled ? { opacity: 0.92 } : undefined,
        props.disabled ? { opacity: 0.55 } : undefined,
        props.style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled }}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' ? { color: c.surface } : undefined,
          variant === 'secondary' ? { color: c.textPrimary } : undefined,
          variant === 'ghost' ? { color: c.primary } : undefined,
        ]}
      >
        {props.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
