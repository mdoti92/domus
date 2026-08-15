import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoadingAndError = async (action: () => Promise<void>): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await action();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String((err as { message?: string })?.message ?? 'Error inesperado');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) return;
    await withLoadingAndError(() =>
      mode === 'login' ? signIn(email.trim(), password) : signUp(email.trim(), password)
    );
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    await withLoadingAndError(signInWithGoogle);
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
  };

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !loading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.appTitle}>Domus</Text>
          <Text style={styles.appSubtitle}>Home App Familiar</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {loading ? (
            <ActivityIndicator color={Colors.gold} style={styles.loader} />
          ) : (
            <>
              <Button
                label={mode === 'login' ? 'Entrar' : 'Registrarme'}
                onPress={handleSubmit}
                disabled={!canSubmit}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button label="Continuar con Google" onPress={handleGoogleSignIn} variant="ghost" />
            </>
          )}

          <Button
            label={mode === 'login' ? '¿Primera vez? Crear cuenta' : 'Ya tengo cuenta'}
            onPress={toggleMode}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 32,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 56,
    color: Colors.gold,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.silverDim,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    gap: 16,
  },
  cardTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 26,
    color: Colors.silver,
    marginBottom: 4,
  },
  errorBox: {
    backgroundColor: '#2a1010',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c87a60',
    padding: 12,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#c87a60',
  },
  loader: {
    paddingVertical: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.silverMuted,
  },
});
