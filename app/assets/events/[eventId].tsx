import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { useEventDetail } from '../../../hooks/useEventDetail';
import { useUpdateEvent } from '../../../hooks/useUpdateEvent';
import { useDeleteEvent } from '../../../hooks/useDeleteEvent';
import { useEventNotificationConfig } from '../../../hooks/useEventNotificationConfig';
import { useSaveEventNotificationConfig } from '../../../hooks/useSaveEventNotificationConfig';
import { useHouseholdMembers } from '../../../hooks/useHouseholdMembers';
import { EditEventModal } from '../../../components/modules/assets/EditEventModal';
import { UpdateEventInput } from '../../../hooks/useUpdateEvent';
import { EventParameterValue, EventStatus } from '../../../types';
import {
  NotificationFormState,
  fromEventNotificationConfig,
  toSaveEventNotificationConfigInput,
} from '../../../lib/notificationFormState';

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

function formatParamValue(pv: EventParameterValue): string {
  if (pv.parameter_type === 'boolean') {
    return pv.parameter_value === 'true' ? 'Sí' : 'No';
  }
  return pv.parameter_value;
}

export default function EventDetailScreen() {
  const { eventId, assetId } = useLocalSearchParams<{ eventId: string; assetId: string }>();
  const router = useRouter();
  const { event, loading, error, refetch } = useEventDetail(eventId);
  const { updateEvent } = useUpdateEvent();
  const { deleteEvent } = useDeleteEvent();
  const {
    config: notificationConfig,
    reminders: notificationReminders,
    recipients: notificationRecipients,
    loading: notificationLoading,
    refetch: refetchNotificationConfig,
  } = useEventNotificationConfig(eventId);
  const { saveConfig } = useSaveEventNotificationConfig();
  const { members: householdMembers } = useHouseholdMembers();
  const [editVisible, setEditVisible] = useState(false);

  const handleSubmitEdit = async (input: UpdateEventInput, notification: NotificationFormState) => {
    await updateEvent(eventId, input);
    await saveConfig(eventId, toSaveEventNotificationConfigInput(notification));
    await Promise.all([refetch(), refetchNotificationConfig()]);
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(eventId);
      if (assetId) {
        router.replace(`/assets/${assetId}`);
      } else {
        router.back();
      }
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el evento. Intentá de nuevo.');
    }
  };

  if (loading || notificationLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar el evento</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[event.status];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.gold} />
        </Pressable>
        <Pressable
          onPress={() => setEditVisible(true)}
          style={styles.editButton}
          accessibilityRole="button"
          accessibilityLabel="Editar evento"
        >
          <Ionicons name="pencil-outline" size={20} color={Colors.goldDim} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.dateTitle}>{formatDate(event.date)}</Text>
          <Text style={[styles.statusBadge, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {event.event_parameter_values.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Valores registrados</Text>
            <View style={styles.valuesCard}>
              {event.event_parameter_values.map((pv, index) => (
                <View
                  key={pv.id}
                  style={[
                    styles.valueRow,
                    index < event.event_parameter_values.length - 1 && styles.valueRowDivider,
                  ]}
                >
                  <Text style={styles.valueName}>{pv.parameter_name}</Text>
                  <Text style={styles.valueText}>{formatParamValue(pv)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {event.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notas</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{event.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {event && (
        <EditEventModal
          visible={editVisible}
          event={event}
          initialNotification={fromEventNotificationConfig(
            notificationConfig,
            notificationReminders,
            notificationRecipients
          )}
          householdMembers={householdMembers}
          onClose={() => setEditVisible(false)}
          onSubmit={handleSubmitEdit}
          onDelete={handleDelete}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    gap: 28,
    paddingBottom: 60,
  },
  headerSection: {
    gap: 6,
  },
  dateTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 34,
    color: Colors.silver,
  },
  statusBadge: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.silverMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  valuesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  valueRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  valueName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.silverDim,
  },
  valueText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.silver,
  },
  notesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  notesText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.silver,
    lineHeight: 22,
  },
});
