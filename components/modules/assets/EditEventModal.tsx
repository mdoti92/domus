import { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  Text,
  Pressable,
  Switch,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { EventWithValues, EventStatus, ParameterType } from '../../../types';
import { UpdateEventInput } from '../../../hooks/useUpdateEvent';

interface EditEventModalProps {
  visible: boolean;
  event: EventWithValues;
  onClose: () => void;
  onSubmit: (input: UpdateEventInput) => Promise<void>;
  onDelete: () => void;
}

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'done', label: 'Realizado' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'cancelled', label: 'Cancelado' },
];

function initParamValues(event: EventWithValues): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (const pv of event.event_parameter_values) {
    result[pv.parameter_name] =
      pv.parameter_type === 'boolean' ? pv.parameter_value === 'true' : pv.parameter_value;
  }
  return result;
}

export function EditEventModal({ visible, event, onClose, onSubmit, onDelete }: EditEventModalProps) {
  const [date, setDate] = useState(event.date);
  const [notes, setNotes] = useState(event.notes ?? '');
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [paramValues, setParamValues] = useState<Record<string, string | boolean>>(
    () => initParamValues(event)
  );
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | undefined>();

  const reset = () => {
    setDate(event.date);
    setNotes(event.notes ?? '');
    setStatus(event.status);
    setParamValues(initParamValues(event));
    setDateError(undefined);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar evento',
      '¿Eliminar este evento y todos sus valores registrados? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!date.trim()) {
      setDateError('La fecha es obligatoria');
      return;
    }
    setDateError(undefined);
    setSubmitting(true);

    const parameterValues = event.event_parameter_values.map((pv) => ({
      name: pv.parameter_name,
      value: pv.parameter_type === 'boolean'
        ? String(Boolean(paramValues[pv.parameter_name] ?? false))
        : String(paramValues[pv.parameter_name] ?? ''),
      type: pv.parameter_type as ParameterType,
    }));

    try {
      await onSubmit({
        date: date.trim(),
        notes: notes.trim() || null,
        status,
        parameterValues,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Editar evento</Text>
              <Pressable onPress={handleClose} style={styles.closeButton} accessibilityLabel="Cerrar">
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Input
                label="Fecha"
                value={date}
                onChangeText={setDate}
                placeholder="AAAA-MM-DD"
                error={dateError}
                keyboardType="numbers-and-punctuation"
              />

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Estado</Text>
                <View style={styles.pillRow}>
                  {STATUS_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[styles.pill, status === opt.value && styles.pillActive]}
                      onPress={() => setStatus(opt.value)}
                    >
                      <Text style={[styles.pillText, status === opt.value && styles.pillTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {event.event_parameter_values.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Parámetros</Text>
                  <View style={styles.paramsList}>
                    {event.event_parameter_values.map((pv) => (
                      <View key={pv.parameter_name} style={styles.paramRow}>
                        <View style={styles.paramLabelRow}>
                          <Text style={styles.paramName}>{pv.parameter_name}</Text>
                        </View>

                        {pv.parameter_type === 'boolean' ? (
                          <Switch
                            value={Boolean(paramValues[pv.parameter_name] ?? false)}
                            onValueChange={(v) =>
                              setParamValues((prev) => ({ ...prev, [pv.parameter_name]: v }))
                            }
                            trackColor={{ false: Colors.border, true: Colors.goldDim }}
                            thumbColor={paramValues[pv.parameter_name] ? Colors.gold : Colors.silverMuted}
                          />
                        ) : (
                          <TextInput
                            style={styles.paramInput}
                            value={String(paramValues[pv.parameter_name] ?? '')}
                            onChangeText={(v) =>
                              setParamValues((prev) => ({ ...prev, [pv.parameter_name]: v }))
                            }
                            keyboardType={pv.parameter_type === 'number' ? 'decimal-pad' : 'default'}
                            placeholder={pv.parameter_type === 'number' ? '0' : 'Valor'}
                            placeholderTextColor={Colors.silverMuted}
                          />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Notas</Text>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Observaciones del evento (opcional)"
                  placeholderTextColor={Colors.silverMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              {submitting ? (
                <ActivityIndicator color={Colors.gold} />
              ) : (
                <>
                  <Button label="Guardar cambios" onPress={handleSubmit} disabled={!date.trim()} />
                  <Pressable onPress={confirmDelete} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>Eliminar evento</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    maxHeight: '92%',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '100%',
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
    fontSize: 24,
    color: Colors.silver,
  },
  closeButton: { padding: 4 },
  closeText: { fontSize: 18, color: Colors.silverDim },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 24, paddingBottom: 8 },
  section: { gap: 10 },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.silverDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  pillActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pillText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.silverDim },
  pillTextActive: { color: Colors.bg, fontFamily: 'Inter_500Medium' },
  paramsList: { gap: 8 },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  paramLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paramName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.silver,
  },
  paramInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.silver,
    minWidth: 80,
    textAlign: 'right',
    paddingVertical: 0,
  },
  notesInput: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.silver,
    minHeight: 80,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#c87a60',
  },
});
