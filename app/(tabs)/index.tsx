import { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { MonthCalendarGrid } from '../../components/modules/home/MonthCalendarGrid';
import { DayActivitySheet } from '../../components/modules/home/DayActivitySheet';
import { AssetPickerSheet } from '../../components/modules/home/AssetPickerSheet';
import { NewEventModal } from '../../components/modules/assets/NewEventModal';
import { useCalendarActivity } from '../../hooks/useCalendarActivity';
import { useDueNotifications } from '../../hooks/useDueNotifications';
import { useAssets } from '../../hooks/useAssets';
import { useCreateEvent, CreateEventInput } from '../../hooks/useCreateEvent';
import { useHouseholdMembers } from '../../hooks/useHouseholdMembers';
import { useSaveEventNotificationConfig } from '../../hooks/useSaveEventNotificationConfig';
import { DayItem } from '../../lib/calendarDayActivity';
import { Asset } from '../../types';
import { NotificationFormState, toSaveEventNotificationConfigInput } from '../../lib/notificationFormState';

export default function HomeScreen() {
  const router = useRouter();
  const { getItemsForDate, loading: activityLoading, error: activityError, refetch: refetchActivity } = useCalendarActivity();
  const { items: dueItems } = useDueNotifications();
  const { assets } = useAssets();
  const { createEvent } = useCreateEvent();
  const { members: householdMembers } = useHouseholdMembers();
  const { saveConfig } = useSaveEventNotificationConfig();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [assetPickerVisible, setAssetPickerVisible] = useState(false);
  const [newEventAsset, setNewEventAsset] = useState<Asset | null>(null);
  const [newEventDate, setNewEventDate] = useState<string | null>(null);

  const selectedDateItems = selectedDate ? getItemsForDate(selectedDate) : [];

  // DOM-34 CA1: tocar cualquier día abre el sheet (con o sin actividad), para
  // que siempre esté ahí la opción de "Agregar evento" — reemplaza el
  // early-return de DOM-29 que solo abría días con indicador.
  const handleSelectDay = (iso: string) => setSelectedDate(iso);

  const handleSelectItem = (item: DayItem) => {
    setSelectedDate(null);
    if (item.type === 'event') {
      router.push(`/assets/events/${item.eventId}`);
    } else {
      router.push(`/assets/${item.assetId}`);
    }
  };

  const handleAddEvent = () => {
    setNewEventDate(selectedDate);
    setSelectedDate(null);
    setAssetPickerVisible(true);
  };

  const handleSelectAsset = (asset: Asset) => {
    setAssetPickerVisible(false);
    setNewEventAsset(asset);
  };

  const handleSubmitEvent = async (input: CreateEventInput, notification: NotificationFormState) => {
    if (!newEventAsset) return;
    const createdEvent = await createEvent(newEventAsset.id, input);
    if (notification.enabled) {
      await saveConfig(createdEvent.id, toSaveEventNotificationConfigInput(notification));
    }
    await refetchActivity();
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
        onAddEvent={handleAddEvent}
      />

      <AssetPickerSheet
        visible={assetPickerVisible}
        assets={assets}
        onClose={() => setAssetPickerVisible(false)}
        onSelectAsset={handleSelectAsset}
      />

      {newEventAsset && (
        <NewEventModal
          visible={newEventAsset !== null}
          onClose={() => setNewEventAsset(null)}
          onSubmit={handleSubmitEvent}
          parameterDefinitions={newEventAsset.parameter_definitions}
          assetName={newEventAsset.name}
          householdMembers={householdMembers}
          initialDate={newEventDate ?? undefined}
        />
      )}
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
