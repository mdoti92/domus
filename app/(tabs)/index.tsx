import { View, StyleSheet } from 'react-native';
import { Text } from '../../components/ui/Text';
import { Colors } from '../../constants/colors';

export default function InicioScreen() {
  return (
    <View style={styles.container}>
      <Text variant="heading" style={styles.title}>Domus</Text>
      <Text variant="body">Tu hogar, organizado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    gap: 8,
  },
  title: {
    fontSize: 56,
    color: Colors.gold,
  },
});
