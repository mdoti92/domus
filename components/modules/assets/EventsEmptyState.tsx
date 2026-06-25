import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Colors } from '../../../constants/colors';

interface EventsEmptyStateProps {
  onRegisterPress: () => void;
}

export function EventsEmptyState({ onRegisterPress }: EventsEmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🌿</Text>
      <Text style={styles.title}>Sin eventos registrados</Text>
      <Text style={styles.subtitle}>Comenzá a registrar el historial de este asset.</Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onRegisterPress}
        accessibilityRole="button"
        accessibilityLabel="Registrar primer evento"
      >
        <Text style={styles.buttonLabel}>Registrar primer evento</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  icon: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 22,
    color: Colors.silver,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.silverDim,
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.gold,
  },
});
