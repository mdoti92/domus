import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Colors } from '../constants/colors';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../hooks/useAuth';
import { useRegisterPushToken } from '../hooks/useRegisterPushToken';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
  });

  const { session, loading: authLoading } = useAuth();
  const { registerToken } = useRegisterPushToken();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (session?.user.id) {
      registerToken(session.user.id);
    }
  }, [session?.user.id, registerToken]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (authLoading) return;
    if (!fontsLoaded && !fontError) return;

    const onLoginScreen = segments[0] === 'login';

    if (!session && !onLoginScreen) {
      router.replace('/login');
    } else if (session && onLoginScreen) {
      router.replace('/(tabs)');
    }
  }, [session, authLoading, fontsLoaded, fontError, segments]);

  if ((!fontsLoaded && !fontError) || authLoading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="assets/[id]"
        options={{
          title: 'Detalle',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.gold,
          headerTitleStyle: {
            fontFamily: 'CormorantGaramond_600SemiBold',
            fontSize: 22,
          },
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.gold,
          headerTitleStyle: {
            fontFamily: 'CormorantGaramond_600SemiBold',
            fontSize: 22,
          },
        }}
      />
    </Stack>
  );
}
