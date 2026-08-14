import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { useDueNotifications } from '../../../hooks/useDueNotifications';
import { formatRelativeDate } from '../../../lib/formatRelativeDate';

export function NotificationBell() {
  const { items, dismiss } = useDueNotifications();
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  const openItem = (eventId: string) => {
    setVisible(false);
    router.push(`/assets/events/${eventId}`);
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={styles.bellButton}
        accessibilityRole="button"
        accessibilityLabel="Notificaciones"
      >
        <Ionicons name="notifications-outline" size={22} color={Colors.gold} />
        {items.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{items.length > 9 ? '9+' : items.length}</Text>
          </View>
        )}
      </Pressable>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Notificaciones</Text>
              <Pressable onPress={() => setVisible(false)} accessibilityLabel="Cerrar">
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            {items.length === 0 ? (
              <Text style={styles.emptyText}>No tenés recordatorios pendientes.</Text>
            ) : (
              <ScrollView style={styles.list}>
                {items.map((item) => (
                  <View key={`${item.eventId}-${item.offset_value}-${item.offset_unit}`} style={styles.item}>
                    <Pressable style={styles.itemMain} onPress={() => openItem(item.eventId)}>
                      <Text style={styles.itemAsset}>{item.assetName}</Text>
                      <Text style={styles.itemMeta}>Vencido {formatRelativeDate(item.dueAt.toISOString())}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => dismiss(item.eventId, item.offset_value, item.offset_unit)}
                      style={styles.dismissButton}
                      accessibilityLabel="Descartar"
                    >
                      <Text style={styles.dismissText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: { paddingHorizontal: 8 },
  badge: {
    position: 'absolute',
    top: -2,
    right: 2,
    backgroundColor: Colors.gold,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: 'Inter_500Medium', fontSize: 10, color: Colors.bg },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  sheet: {
    width: 320,
    maxHeight: 400,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 18,
    color: Colors.silver,
  },
  closeText: { fontSize: 16, color: Colors.silverDim },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.silverDim,
    padding: 20,
    textAlign: 'center',
  },
  list: { maxHeight: 340 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  itemMain: { flex: 1, gap: 2 },
  itemAsset: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.silver },
  itemMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.silverDim },
  dismissButton: { padding: 4 },
  dismissText: { fontSize: 14, color: Colors.silverMuted },
});
