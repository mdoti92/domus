import { Pressable, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ColorValue } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../../components/modules/notifications/NotificationBell';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconsName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color as string} />
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <Pressable
      onPress={signOut}
      style={{ paddingRight: 16 }}
      accessibilityRole="button"
      accessibilityLabel="Cerrar sesión"
    >
      <Ionicons name="log-out-outline" size={22} color={Colors.gold} />
    </Pressable>
  );
}

function SettingsButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/settings')}
      style={{ paddingRight: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Ajustes"
    >
      <Ionicons name="settings-outline" size={22} color={Colors.gold} />
    </Pressable>
  );
}

function HeaderActions() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <NotificationBell />
      <SettingsButton />
      <SignOutButton />
    </View>
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
          headerRight: () => <HeaderActions />,
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
