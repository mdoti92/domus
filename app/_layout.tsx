import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#132318' },
        headerTintColor: '#c8b560',
        contentStyle: { backgroundColor: '#0d1a0f' },
      }}
    />
  );
}
