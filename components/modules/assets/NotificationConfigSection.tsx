import { useState } from 'react';
import { View, Text, Pressable, Switch, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { HouseholdMember, NotificationTimeUnit, RecurrenceType } from '../../../types';
import { NotificationFormState, createReminderFormRow, getPositiveNumberError } from '../../../lib/notificationFormState';
import { DatePickerField } from '../../ui/DatePickerField';

interface NotificationConfigSectionProps {
  value: NotificationFormState;
  onChange: (value: NotificationFormState) => void;
  householdMembers: HouseholdMember[];
}

const RECURRENCE_TYPE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'date', label: 'Fecha' },
  { value: 'interval', label: 'Repetir cada' },
];

const TIME_UNIT_OPTIONS: { value: NotificationTimeUnit; label: string }[] = [
  { value: 'hour', label: 'hora' },
  { value: 'day', label: 'día' },
  { value: 'week', label: 'semana' },
  { value: 'month', label: 'mes' },
  { value: 'year', label: 'año' },
];

function UnitPicker({ value, onChange }: { value: NotificationTimeUnit; onChange: (unit: NotificationTimeUnit) => void }) {
  return (
    <View style={styles.pillRow}>
      {TIME_UNIT_OPTIONS.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.pill, value === opt.value && styles.pillActive]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[styles.pillText, value === opt.value && styles.pillTextActive]}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function NotificationConfigSection({ value, onChange, householdMembers }: NotificationConfigSectionProps) {
  const [recipientSearch, setRecipientSearch] = useState('');

  const patch = (partial: Partial<NotificationFormState>) => onChange({ ...value, ...partial });

  const addReminder = () => {
    patch({ reminders: [...value.reminders, createReminderFormRow()] });
  };

  const updateReminder = (id: string, partial: { value?: string; unit?: NotificationTimeUnit }) => {
    patch({
      reminders: value.reminders.map((reminder) => (reminder.id === id ? { ...reminder, ...partial } : reminder)),
    });
  };

  const removeReminder = (id: string) => {
    patch({ reminders: value.reminders.filter((reminder) => reminder.id !== id) });
  };

  const addRecipient = (memberId: string) => {
    if (value.recipientIds.includes(memberId)) return;
    patch({ recipientIds: [...value.recipientIds, memberId] });
    setRecipientSearch('');
  };

  const removeRecipient = (memberId: string) => {
    patch({ recipientIds: value.recipientIds.filter((id) => id !== memberId) });
  };

  const selectedMembers = householdMembers.filter((m) => value.recipientIds.includes(m.id));
  const searchResults = recipientSearch.trim()
    ? householdMembers.filter(
        (m) =>
          !value.recipientIds.includes(m.id) &&
          m.display_name.toLowerCase().includes(recipientSearch.trim().toLowerCase())
      )
    : [];

  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.cardTitle}>Notificarme</Text>
          <Switch
            value={value.enabled}
            onValueChange={(enabled) => patch({ enabled })}
            trackColor={{ false: Colors.border, true: Colors.goldDim }}
            thumbColor={value.enabled ? Colors.gold : Colors.silverMuted}
          />
        </View>
      </View>

      {value.enabled && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recurrencia</Text>
            <View style={styles.pillRow}>
              {RECURRENCE_TYPE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.pill, value.recurrenceType === opt.value && styles.pillActive]}
                  onPress={() => patch({ recurrenceType: opt.value })}
                >
                  <Text style={[styles.pillText, value.recurrenceType === opt.value && styles.pillTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {value.recurrenceType === 'date' ? (
              <DatePickerField
                value={value.recurrenceDate || null}
                onChange={(recurrenceDate) => patch({ recurrenceDate })}
                placeholder="Elegir la próxima ocurrencia"
              />
            ) : (
              <View>
                <View style={styles.unifiedRow}>
                  <Ionicons name="repeat-outline" size={18} color={Colors.gold} />
                  <Text style={styles.unifiedRowLabel}>cada</Text>
                  <TextInput
                    style={styles.intervalInput}
                    value={value.intervalValue}
                    onChangeText={(intervalValue) => patch({ intervalValue })}
                    keyboardType="number-pad"
                    placeholder="1"
                    placeholderTextColor={Colors.silverMuted}
                  />
                  <UnitPicker value={value.intervalUnit} onChange={(intervalUnit) => patch({ intervalUnit })} />
                </View>
                {getPositiveNumberError(value.intervalValue) && (
                  <Text style={styles.fieldError}>{getPositiveNumberError(value.intervalValue)}</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recordatorios</Text>

            {value.reminders.map((reminder) => {
              const reminderError = getPositiveNumberError(reminder.value);
              return (
                <View key={reminder.id}>
                  <View style={styles.unifiedRow}>
                    <Ionicons name="alarm-outline" size={16} color={Colors.silverDim} />
                    <TextInput
                      style={styles.intervalInput}
                      value={reminder.value}
                      onChangeText={(text) => updateReminder(reminder.id, { value: text })}
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={Colors.silverMuted}
                    />
                    <UnitPicker value={reminder.unit} onChange={(unit) => updateReminder(reminder.id, { unit })} />
                    <Pressable onPress={() => removeReminder(reminder.id)} accessibilityLabel="Quitar recordatorio">
                      <Text style={styles.chipRemove}>✕</Text>
                    </Pressable>
                  </View>
                  {reminderError && <Text style={styles.fieldError}>{reminderError}</Text>}
                </View>
              );
            })}

            <Pressable style={styles.addButton} onPress={addReminder}>
              <Text style={styles.addButtonText}>+ Agregar recordatorio</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.switchRow}>
              <Text style={styles.cardTitle}>Notificar a todo el hogar</Text>
              <Switch
                value={value.notifyAllHousehold}
                onValueChange={(notifyAllHousehold) => patch({ notifyAllHousehold })}
                trackColor={{ false: Colors.border, true: Colors.goldDim }}
                thumbColor={value.notifyAllHousehold ? Colors.gold : Colors.silverMuted}
              />
            </View>

            {!value.notifyAllHousehold && (
              <View style={styles.recipientsBox}>
                <Text style={styles.recipientsHint}>Destinatarios</Text>

                {selectedMembers.length > 0 && (
                  <View style={styles.chipWrap}>
                    {selectedMembers.map((member) => (
                      <View key={member.id} style={styles.recipientChip}>
                        <Text style={styles.chipText}>{member.display_name}</Text>
                        <Pressable onPress={() => removeRecipient(member.id)} accessibilityLabel={`Quitar a ${member.display_name}`}>
                          <Text style={styles.chipRemove}>✕</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                <TextInput
                  style={styles.searchInput}
                  value={recipientSearch}
                  onChangeText={setRecipientSearch}
                  placeholder="Buscar integrante del hogar"
                  placeholderTextColor={Colors.silverMuted}
                />

                {searchResults.length > 0 && (
                  <View style={styles.searchResults}>
                    {searchResults.map((member) => (
                      <Pressable key={member.id} style={styles.searchResultRow} onPress={() => addRecipient(member.id)}>
                        <Ionicons name="person-add-outline" size={16} color={Colors.gold} />
                        <Text style={styles.chipText}>{member.display_name}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
  },
  cardTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.silverDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  unifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  unifiedRowLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.silverDim,
  },
  intervalInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.gold,
    width: 56,
    textAlign: 'center',
  },
  fieldError: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#c87a60',
    marginTop: 6,
  },
  chipText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.silver },
  chipRemove: { fontSize: 14, color: Colors.silverMuted, paddingHorizontal: 4 },
  addButton: { paddingVertical: 4, alignSelf: 'flex-start' },
  addButtonText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.gold },
  recipientsBox: { gap: 10 },
  recipientsHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.silverMuted,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gold,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  searchInput: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.silver,
  },
  searchResults: {
    backgroundColor: Colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});
