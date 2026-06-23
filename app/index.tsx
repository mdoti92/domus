import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Domus</Text>
      <Text style={styles.subtitle}>Tu hogar, organizado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1a0f',
  },
  title: {
    fontSize: 48,
    color: '#c8b560',
  },
  subtitle: {
    fontSize: 16,
    color: '#8a9a84',
    marginTop: 8,
  },
});
