import { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { MonthCalendarGrid } from '../../components/modules/home/MonthCalendarGrid';
import { DayActivitySheet } from '../../components/modules/home/DayActivitySheet';
import { useCalendarActivity } from '../../hooks/useCalendarActivity';
import { useDueNotifications } from '../../hooks/useDueNotifications';
import { DayItem } from '../../lib/calendarDayActivity';

export default function HomeScreen() {
  const router = useRouter();
  const { getItemsForDate, loading: activityLoading, error: activityError } = useCalendarActivity();
  const { items: dueItems } = useDueNotifications();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedDateItems = selectedDate ? getItemsForDate(selectedDate) : [];

  const handleSelectDay = (iso: string) => {
    // CA4: un día sin actividad no abre nada.
    if (getItemsForDate(iso).length === 0) return;
    setSelectedDate(iso);
  };

  const handleSelectItem = (item: DayItem) => {
    setSelectedDate(null);
    if (item.type === 'event') {
      router.push(`/assets/events/${item.eventId}`);
    } else {
      router.push(`/assets/${item.assetId}`);
    }
  };

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

        <MonthCalendarGrid getItemsForDate={getItemsForDate} onSelectDay={handleSelectDay} />
      </ScrollView>

      <DayActivitySheet
        visible={selectedDate !== null}
        date={selectedDate}
        items={selectedDateItems}
        onClose={() => setSelectedDate(null)}
        onSelectItem={handleSelectItem}
      />
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
