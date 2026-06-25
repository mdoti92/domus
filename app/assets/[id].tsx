import { View, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Detalle del asset</Text>
      <Text style={styles.id}>{id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholder: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 28,
    color: Colors.silver,
  },
  id: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.silverMuted,
  },
});
