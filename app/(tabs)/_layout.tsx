import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ColorValue } from 'react-native';
import { Colors } from '../../constants/colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconsName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color as string} />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.silverMuted,
        tabBarLabelStyle: {
          fontFamily: 'Inter_400Regular',
          fontSize: 11,
        },
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.gold,
        headerTitleStyle: {
          fontFamily: 'CormorantGaramond_600SemiBold',
          fontSize: 22,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: tabIcon('home-outline'),
        }}
      />
      <Tabs.Screen
        name="mantenimiento"
        options={{
          title: 'Mantenimiento',
          tabBarIcon: tabIcon('construct-outline'),
        }}
      />
      <Tabs.Screen
        name="obras"
        options={{
          title: 'Obras',
          tabBarIcon: tabIcon('hammer-outline'),
        }}
      />
    </Tabs>
  );
}
