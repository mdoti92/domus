import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Button } from '../../ui/Button';
import { useGoogleCalendarConnection } from '../../../hooks/useGoogleCalendarConnection';
import { describeConnectionStatus } from '../../../lib/googleCalendarConnection';

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'No se pudo completar la operación. Intentá de nuevo.';
}

export function GoogleCalendarConnectionCard() {
  const { info, loading, error, connecting, connect } = useGoogleCalendarConnection();

  const status = info?.status ?? 'not_connected';
  const description = describeConnectionStatus(status);
  const buttonLabel = description.needsReconnect ? 'Reconectar cuenta de Google' : 'Conectar cuenta de Google';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Calendario de Google</Text>

      {loading ? (
        <ActivityIndicator color={Colors.gold} />
      ) : (
        <>
          <View style={styles.statusRow}>
            <Ionicons
              name={status === 'connected' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={18}
              color={status === 'connected' ? Colors.gold : Colors.silverDim}
            />
            <Text style={styles.statusLabel}>{description.label}</Text>
          </View>

          <Text style={styles.detail}>{description.detail}</Text>

          {info?.googleAccountEmail && (
            <Text style={styles.meta}>Cuenta: {info.googleAccountEmail}</Text>
          )}
          {info?.calendarSummary && (
            <Text style={styles.meta}>Calendario: {info.calendarSummary}</Text>
          )}

          {(status === 'not_connected' || description.needsReconnect) && (
            <Button label={buttonLabel} onPress={connect} disabled={connecting} />
          )}

          {error != null && <Text style={styles.errorText}>{errorMessage(error)}</Text>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.silverDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 20,
    color: Colors.silver,
  },
  detail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.silverDim,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.silverMuted,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#c87a60',
  },
});
