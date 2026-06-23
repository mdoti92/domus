import { Text as RNText, StyleSheet, TextProps } from 'react-native';
import { Colors } from '../../constants/colors';

interface ElvenTextProps extends TextProps {
  variant?: 'heading' | 'body';
}

export function Text({ variant = 'body', style, ...props }: ElvenTextProps) {
  return (
    <RNText
      style={[variant === 'heading' ? styles.heading : styles.body, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 32,
    lineHeight: 40,
    color: Colors.silver,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.silverDim,
  },
});
