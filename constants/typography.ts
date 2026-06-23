import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography = {
  heading1: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 40,
    lineHeight: 48,
    color: Colors.silver,
  } satisfies TextStyle,

  heading2: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 30,
    lineHeight: 38,
    color: Colors.silver,
  } satisfies TextStyle,

  heading3: {
    fontFamily: 'CormorantGaramond_500Medium',
    fontSize: 22,
    lineHeight: 30,
    color: Colors.silver,
  } satisfies TextStyle,

  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.silver,
  } satisfies TextStyle,

  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.silverDim,
  } satisfies TextStyle,

  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.silverDim,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 14,
    color: Colors.silverMuted,
  } satisfies TextStyle,
} as const;
