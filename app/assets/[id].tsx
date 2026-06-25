import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAssetDetail } from '../../hooks/useAssetDetail';
import { useCreateEvent } from '../../hooks/useCreateEvent';
import { AssetDetailHeader } from '../../components/modules/assets/AssetDetailHeader';
import { EventCard } from '../../components/modules/assets/EventCard';
import { EventsEmptyState } from '../../components/modules/assets/EventsEmptyState';
import { NewEventModal } from '../../components/modules/assets/NewEventModal';
import { CreateEventInput } from '../../hooks/useCreateEvent';

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { asset, events, loading, error, refetch } = useAssetDetail(id);
  const { createEvent } = useCreateEvent();
  const [modalVisible, setModalVisible] = useState(false);

  const handleNewEventPress = () => setModalVisible(true);

  const handleSubmitEvent = async (input: CreateEventInput) => {
    await createEvent(id, input);
    await refetch();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (error || !asset) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar el asset</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AssetDetailHeader asset={asset} />

        <View style={styles.divider} />

        <View style={styles.eventsSection}>
          <Text style={styles.sectionLabel}>Historial de eventos</Text>
          {events.length === 0 ? (
            <EventsEmptyState onRegisterPress={handleNewEventPress} />
          ) : (
            <View style={styles.eventsList}>
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {events.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={handleNewEventPress}
          accessibilityRole="button"
          accessibilityLabel="Registrar nuevo evento"
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      )}

      <NewEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitEvent}
        parameterDefinitions={asset.parameter_definitions}
        assetName={asset.name}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    gap: 12,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.silverDim,
  },
  backLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backLinkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.gold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    gap: 24,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  eventsSection: {
    gap: 14,
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.silverMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  eventsList: {
    gap: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  fabIcon: {
    fontSize: 28,
    color: Colors.bg,
    lineHeight: 32,
    fontFamily: 'Inter_400Regular',
  },
});
