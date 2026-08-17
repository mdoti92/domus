import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Button } from '../../ui/Button';
import { DayItem } from '../../../lib/calendarDayActivity';
import { MONTH_NAMES } from '../../../lib/calendarGrid';

interface DayActivitySheetProps {
  visible: boolean;
  date: string | null;
  items: DayItem[];
  onClose: () => void;
  onSelectItem: (item: DayItem) => void;
  onAddEvent: () => void;
}

export function formatDayTitle(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} de ${MONTH_NAMES[month - 1]} ${year}`;
}

export function DayActivitySheet({ visible, date, items, onClose, onSelectItem, onAddEvent }: DayActivitySheetProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{date ? formatDayTitle(date) : ''}</Text>
            <Pressable onPress={onClose} accessibilityLabel="Cerrar">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {items.length > 0 && (
            <ScrollView style={styles.list}>
              {items.map((item, index) => (
                <Pressable
                  key={`${item.type}-${item.assetId}-${index}`}
                  style={styles.item}
                  onPress={() => onSelectItem(item)}
                >
                  <Ionicons
                    name={item.type === 'event' ? 'checkmark-circle-outline' : 'time-outline'}
                    size={18}
                    color={Colors.gold}
                  />
                  <View style={styles.itemText}>
                    <Text style={styles.itemAsset}>{item.assetName}</Text>
                    <Text style={styles.itemMeta}>
                      {item.type === 'event' ? 'Evento registrado' : 'Próxima ocurrencia'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Button label="+ Agregar evento" onPress={onAddEvent} variant="ghost" />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 20,
    color: Colors.silver,
  },
  closeText: { fontSize: 16, color: Colors.silverDim },
  footer: {
    padding: 16,
  },
  list: { paddingVertical: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemText: { flex: 1, gap: 2 },
  itemAsset: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.silver },
  itemMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.silverDim },
});
