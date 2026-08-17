import { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { DatePickerField } from '../../ui/DatePickerField';
import { Person } from '../../../types';
import { UpdatePersonInput } from '../../../hooks/useUpdatePerson';

const PERSON_ICONS = ['👤', '👧', '👦', '👶', '👵', '👴', '🐕', '🐈'];

interface EditPersonModalProps {
  visible: boolean;
  person: Person;
  onClose: () => void;
  onSubmit: (input: UpdatePersonInput) => Promise<void>;
  onDelete: () => Promise<void>;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'No se pudo eliminar. Intentá de nuevo.';
}

export function EditPersonModal({ visible, person, onClose, onSubmit, onDelete }: EditPersonModalProps) {
  const [name, setName] = useState(person.name);
  const [relationship, setRelationship] = useState(person.relationship ?? '');
  const [birthDate, setBirthDate] = useState<string | null>(person.birth_date);
  const [icon, setIcon] = useState<string | null>(person.icon);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reset = () => {
    setName(person.name);
    setRelationship(person.relationship ?? '');
    setBirthDate(person.birth_date);
    setIcon(person.icon);
    setSubmitting(false);
    setNameError(undefined);
    setDeleteError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError('El nombre es obligatorio');
      return;
    }
    setNameError(undefined);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        relationship: relationship.trim() || null,
        birth_date: birthDate,
        icon,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar persona',
      `¿Eliminar a ${person.name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleteError(null);
            try {
              await onDelete();
            } catch (err) {
              setDeleteError(errorMessage(err));
            }
          },
        },
      ]
    );
  };

  const canSubmit = name.trim().length > 0 && !submitting;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Editar persona</Text>
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
              <Input label="Nombre" value={name} onChangeText={setName} error={nameError} />
              <Input label="Relación" value={relationship} onChangeText={setRelationship} placeholder="Ej: hija, mascota" />
              <DatePickerField label="Fecha de nacimiento" value={birthDate} onChange={setBirthDate} placeholder="Opcional" />

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Icono</Text>
                <View style={styles.iconGrid}>
                  {PERSON_ICONS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      style={[styles.iconOption, icon === emoji && styles.iconOptionActive]}
                      onPress={() => setIcon(icon === emoji ? null : emoji)}
                    >
                      <Text style={styles.iconEmoji}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {deleteError && <Text style={styles.errorText}>{deleteError}</Text>}

              <Pressable onPress={confirmDelete} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Eliminar persona</Text>
              </Pressable>
            </ScrollView>

            <View style={styles.footer}>
              {submitting ? (
                <ActivityIndicator color={Colors.gold} />
              ) : (
                <Button label="Guardar cambios" onPress={handleSubmit} disabled={!canSubmit} />
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
  keyboardView: { maxHeight: '92%' },
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
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 24, color: Colors.silver },
  closeButton: { padding: 4 },
  closeText: { fontSize: 18, color: Colors.silverDim },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20, paddingBottom: 8 },
  section: { gap: 10 },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.silverDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconOptionActive: { borderColor: Colors.gold, backgroundColor: Colors.goldDim + '33' },
  iconEmoji: { fontSize: 22 },
  deleteButton: { paddingVertical: 8 },
  deleteText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#c87a60' },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#c87a60' },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
});
