import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#132318', borderTopColor: '#2a4a2e' },
        tabBarActiveTintColor: '#c8b560',
        tabBarInactiveTintColor: '#8a9a84',
        headerStyle: { backgroundColor: '#132318' },
        headerTintColor: '#c8b560',
      }}
    />
  );
}
