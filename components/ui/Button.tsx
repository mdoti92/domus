import { Pressable, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={variant === 'primary' ? styles.primaryLabel : styles.ghostLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.gold,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
  primaryLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.bg,
    letterSpacing: 0.2,
  },
  ghostLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.gold,
    letterSpacing: 0.2,
  },
});
