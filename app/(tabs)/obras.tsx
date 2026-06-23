import { View, StyleSheet } from 'react-native';
import { Text } from '../../components/ui/Text';
import { Colors } from '../../constants/colors';

export default function ObrasScreen() {
  return (
    <View style={styles.container}>
      <Text variant="heading">Obras</Text>
      <Text variant="body">Próximamente...</Text>
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
});
