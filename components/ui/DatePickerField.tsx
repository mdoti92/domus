import { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Calendar } from './Calendar';

interface DatePickerFieldProps {
  label?: string;
  value: string | null;
  onChange: (isoDate: string) => void;
  placeholder?: string;
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDisplayDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value.includes('T') ? value : `${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  const formatted = parsed.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return capitalizeFirst(formatted);
}

export function DatePickerField({ label, value, onChange, placeholder = 'Elegir fecha' }: DatePickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const displayValue = formatDisplayDate(value);

  const handleSelect = (isoDate: string) => {
    onChange(isoDate);
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable style={styles.field} onPress={() => setVisible(true)} accessibilityRole="button">
        <Text style={displayValue ? styles.valueText : styles.placeholderText}>
          {displayValue ?? placeholder}
        </Text>
      </Pressable>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Calendar value={value} onSelect={handleSelect} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.silverDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  field: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  valueText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.silver,
  },
  placeholderText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.silverMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
