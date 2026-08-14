import { useState } from 'react';
import { View, Text, Pressable, Switch, TextInput, StyleSheet } from 'react-native';
import { Colors } from '../../../constants/colors';
import { HouseholdMember, NotificationTimeUnit, RecurrenceType } from '../../../types';
import { NotificationFormState } from '../../../lib/notificationFormState';

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

function unitLabel(unit: NotificationTimeUnit): string {
  return TIME_UNIT_OPTIONS.find((o) => o.value === unit)?.label ?? unit;
}

export function NotificationConfigSection({ value, onChange, householdMembers }: NotificationConfigSectionProps) {
  const [reminderValue, setReminderValue] = useState('1');
  const [reminderUnit, setReminderUnit] = useState<NotificationTimeUnit>('day');
  const [recipientSearch, setRecipientSearch] = useState('');

  const patch = (partial: Partial<NotificationFormState>) => onChange({ ...value, ...partial });

  const addReminder = () => {
    const parsed = Number(reminderValue);
    if (!parsed || parsed <= 0) return;
    patch({ reminders: [...value.reminders, { offset_value: parsed, offset_unit: reminderUnit }] });
    setReminderValue('1');
  };

  const removeReminder = (index: number) => {
    patch({ reminders: value.reminders.filter((_, i) => i !== index) });
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
    <View style={styles.section}>
      <View style={styles.switchRow}>
        <Text style={styles.sectionLabel}>Notificarme</Text>
        <Switch
          value={value.enabled}
          onValueChange={(enabled) => patch({ enabled })}
          trackColor={{ false: Colors.border, true: Colors.goldDim }}
          thumbColor={value.enabled ? Colors.gold : Colors.silverMuted}
        />
      </View>

      {value.enabled && (
        <View style={styles.body}>
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
            <TextInput
              style={styles.textInput}
              value={value.recurrenceDate}
              onChangeText={(recurrenceDate) => patch({ recurrenceDate })}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={Colors.silverMuted}
            />
          ) : (
            <View style={styles.intervalRow}>
              <TextInput
                style={styles.intervalInput}
                value={value.intervalValue}
                onChangeText={(intervalValue) => patch({ intervalValue })}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={Colors.silverMuted}
              />
              <View style={styles.pillRow}>
                {TIME_UNIT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.pill, value.intervalUnit === opt.value && styles.pillActive]}
                    onPress={() => patch({ intervalUnit: opt.value })}
                  >
                    <Text style={[styles.pillText, value.intervalUnit === opt.value && styles.pillTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.subsection}>
            <Text style={styles.subsectionLabel}>Recordatorios</Text>

            {value.reminders.map((reminder, index) => (
              <View key={`${reminder.offset_unit}-${reminder.offset_value}-${index}`} style={styles.chipRow}>
                <Text style={styles.chipText}>
                  {reminder.offset_value} {unitLabel(reminder.offset_unit)} antes
                </Text>
                <Pressable onPress={() => removeReminder(index)} accessibilityLabel="Quitar recordatorio">
                  <Text style={styles.chipRemove}>✕</Text>
                </Pressable>
              </View>
            ))}

            <View style={styles.intervalRow}>
              <TextInput
                style={styles.intervalInput}
                value={reminderValue}
                onChangeText={setReminderValue}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={Colors.silverMuted}
              />
              <View style={styles.pillRow}>
                {TIME_UNIT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.pill, reminderUnit === opt.value && styles.pillActive]}
                    onPress={() => setReminderUnit(opt.value)}
                  >
                    <Text style={[styles.pillText, reminderUnit === opt.value && styles.pillTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable style={styles.addButton} onPress={addReminder}>
              <Text style={styles.addButtonText}>+ Agregar recordatorio</Text>
            </Pressable>
          </View>

          <View style={styles.subsection}>
            <View style={styles.switchRow}>
              <Text style={styles.subsectionLabel}>Notificar a todo el hogar</Text>
              <Switch
                value={value.notifyAllHousehold}
                onValueChange={(notifyAllHousehold) => patch({ notifyAllHousehold })}
                trackColor={{ false: Colors.border, true: Colors.goldDim }}
                thumbColor={value.notifyAllHousehold ? Colors.gold : Colors.silverMuted}
              />
            </View>

            {!value.notifyAllHousehold && (
              <View style={styles.recipientsBox}>
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
                  style={styles.textInput}
                  value={recipientSearch}
                  onChangeText={setRecipientSearch}
                  placeholder="Buscar integrante del hogar"
                  placeholderTextColor={Colors.silverMuted}
                />

                {searchResults.length > 0 && (
                  <View style={styles.searchResults}>
                    {searchResults.map((member) => (
                      <Pressable key={member.id} style={styles.searchResultRow} onPress={() => addRecipient(member.id)}>
                        <Text style={styles.chipText}>{member.display_name}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.silverDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: { gap: 16 },
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
  textInput: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.silver,
  },
  intervalRow: { gap: 10 },
  intervalInput: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.silver,
    width: 80,
  },
  subsection: { gap: 10 },
  subsectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.silverDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.silver },
  chipRemove: { fontSize: 14, color: Colors.silverMuted, paddingHorizontal: 4 },
  addButton: { paddingVertical: 6 },
  addButtonText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.gold },
  recipientsBox: { gap: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  searchResults: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  searchResultRow: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
});
