import { View, StyleSheet, Text } from 'react-native';
import { Button } from '../../ui/Button';
import { Colors } from '../../../constants/colors';

interface EmptyStateProps {
  onCreatePress: () => void;
}

export function EmptyState({ onCreatePress }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🏡</Text>
      <Text style={styles.title}>Tu hogar te espera</Text>
      <Text style={styles.subtitle}>
        Registrá los activos de tu hogar para llevar un historial de cada uno.
      </Text>
      <Button label="Crear primer asset" onPress={onCreatePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  icon: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 28,
    color: Colors.silver,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.silverDim,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
});
