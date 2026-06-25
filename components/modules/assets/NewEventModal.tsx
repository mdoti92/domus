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
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ParameterDefinition } from '../../../types';
import { CreateEventInput } from '../../../hooks/useCreateEvent';

interface NewEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: CreateEventInput) => Promise<void>;
  parameterDefinitions: ParameterDefinition[];
  assetName: string;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function NewEventModal({
  visible,
  onClose,
  onSubmit,
  parameterDefinitions,
  assetName,
}: NewEventModalProps) {
  const [date, setDate] = useState(todayISO);
  const [notes, setNotes] = useState('');
  const [paramValues, setParamValues] = useState<Record<string, string | boolean>>({});
  const [dateError, setDateError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setDate(todayISO());
    setNotes('');
    setParamValues({});
    setDateError(undefined);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const setStringValue = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const setBooleanValue = (name: string, value: boolean) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!date.trim()) {
      setDateError('La fecha es obligatoria');
      return;
    }
    setDateError(undefined);
    setSubmitting(true);

    const parameterValues = parameterDefinitions
      .filter((p) => {
        const val = paramValues[p.name];
        if (p.type === 'boolean') return val !== undefined;
        return val !== undefined && String(val).trim() !== '';
      })
      .map((p) => ({
        name: p.name,
        value: paramValues[p.name] ?? '',
        type: p.type,
      }));

    try {
      await onSubmit({
        date: date.trim(),
        notes: notes.trim() || null,
        parameterValues,
      });
      reset();
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
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Nuevo evento</Text>
                <Text style={styles.headerSubtitle}>{assetName}</Text>
              </View>
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

              {parameterDefinitions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Parámetros</Text>
                  <View style={styles.paramsList}>
                    {parameterDefinitions.map((param) => (
                      <View key={param.name} style={styles.paramRow}>
                        <View style={styles.paramLabelRow}>
                          <Text style={styles.paramName}>{param.name}</Text>
                          {param.unit && (
                            <Text style={styles.paramUnit}>{param.unit}</Text>
                          )}
                        </View>

                        {param.type === 'boolean' ? (
                          <Switch
                            value={Boolean(paramValues[param.name] ?? false)}
                            onValueChange={(v) => setBooleanValue(param.name, v)}
                            trackColor={{ false: Colors.border, true: Colors.goldDim }}
                            thumbColor={paramValues[param.name] ? Colors.gold : Colors.silverMuted}
                          />
                        ) : (
                          <TextInput
                            style={styles.paramInput}
                            value={String(paramValues[param.name] ?? '')}
                            onChangeText={(v) => setStringValue(param.name, v)}
                            keyboardType={param.type === 'number' ? 'decimal-pad' : 'default'}
                            placeholder={param.type === 'number' ? '0' : 'Ingresar valor'}
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
                <Button label="Registrar evento" onPress={handleSubmit} disabled={!date.trim()} />
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
  headerText: {
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 24,
    color: Colors.silver,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.silverDim,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: Colors.silverDim,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 8,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.silverDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  paramsList: {
    gap: 8,
  },
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
  paramUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.silverMuted,
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
  },
});
