import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Colors } from '../../../constants/colors';
import { EventWithValues, EventStatus } from '../../../types';

interface EventCardProps {
  event: EventWithValues;
  onPress?: () => void;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`;
}

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string }> = {
  done: { label: 'Realizado', color: Colors.silver },
  pending: { label: 'Pendiente', color: Colors.gold },
  cancelled: { label: 'Cancelado', color: Colors.silverMuted },
};

export function EventCard({ event, onPress }: EventCardProps) {
  const statusConfig = STATUS_CONFIG[event.status];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && onPress && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(event.date)}</Text>
        <Text style={[styles.status, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
      </View>

      {event.event_parameter_values.length > 0 && (
        <View style={styles.values}>
          {event.event_parameter_values.map((val) => (
            <View key={val.id} style={styles.valueRow}>
              <Text style={styles.valueName}>{val.parameter_name}</Text>
              <Text style={styles.valueSeparator}>·</Text>
              <Text style={styles.valueText}>
                {val.parameter_type === 'boolean'
                  ? val.parameter_value === 'true' ? 'Sí' : 'No'
                  : val.parameter_value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {event.notes && (
        <Text style={styles.notes}>{event.notes}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 18,
    color: Colors.silver,
  },
  status: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  values: {
    gap: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.silverDim,
  },
  valueSeparator: {
    fontSize: 13,
    color: Colors.silverMuted,
  },
  valueText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.silver,
  },
  notes: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.silverDim,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
