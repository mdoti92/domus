import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

interface TentativeOccurrenceSheetProps {
  visible: boolean;
  assetName: string | null;
  dateISO: string | null;
  onClose: () => void;
}

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} de ${MONTH_NAMES[month - 1]} ${year}`;
}

// DOM-35 CA5: una ocurrencia tentativa es solo una proyección calculada por
// recurrencia -- no hay fila real en events todavía, así que esta vista es
// puramente de referencia (sin editar, sin borrar, sin "confirmar"). Para
// registrarla de verdad hay que crear el evento por el flujo normal.
export function TentativeOccurrenceSheet({ visible, assetName, dateISO, onClose }: TentativeOccurrenceSheetProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Ionicons name="time-outline" size={28} color={Colors.gold} />
          <Text style={styles.title}>{assetName}</Text>
          <Text style={styles.subtitle}>
            Ocurrencia estimada para el {dateISO ? formatDate(dateISO) : ''}
          </Text>
          <Text style={styles.hint}>
            Todavía no es un evento registrado. Para dejarlo asentado, creá el evento desde el asset.
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 22,
    color: Colors.silver,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.gold,
    textAlign: 'center',
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.silverDim,
    textAlign: 'center',
    lineHeight: 18,
  },
  closeButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.silverDim,
  },
});
