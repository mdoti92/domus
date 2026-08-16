import { View, ScrollView, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Calendar } from '../../components/ui/Calendar';
import { useCalendarActivity } from '../../hooks/useCalendarActivity';
import { useDueNotifications } from '../../hooks/useDueNotifications';

// DOM-29 va a conectar tocar un día con algo (ver eventos de esa fecha).
// Por ahora no hace nada, está fuera de alcance de DOM-28.
function noop(): void {}

export default function HomeScreen() {
  const { markedDates, loading: activityLoading, error: activityError } = useCalendarActivity();
  const { items: dueItems } = useDueNotifications();

  if (activityLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (activityError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error al cargar el calendario</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {dueItems.length > 0 && (
          <View style={styles.dueBanner}>
            <Ionicons name="alarm-outline" size={16} color={Colors.gold} />
            <Text style={styles.dueBannerText}>
              {dueItems.length} {dueItems.length === 1 ? 'recordatorio vencido' : 'recordatorios vencidos'}
            </Text>
          </View>
        )}

        <Calendar value={null} onSelect={noop} markedDates={markedDates} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.silverDim,
  },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dueBannerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.gold,
  },
});
