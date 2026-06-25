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
import { ASSET_CATEGORIES } from '../../../constants/assetCategories';
import { ParameterType, Asset } from '../../../types';
import { UpdateAssetInput } from '../../../hooks/useUpdateAsset';

const ASSET_ICONS = [
  '🏠', '🚗', '🏊', '🔧', '🔩', '⚙️',
  '💊', '🏥', '❤️', '🩺', '👤', '👨',
  '🏗️', '🏚️', '🔨', '⚒️', '🪚', '📐',
  '🌱', '🌳', '🪴', '🌿', '💧', '🌊',
  '🐕', '🐈', '🌡️', '🔑', '📦', '💡',
];

const PARAMETER_TYPE_LABELS: Record<ParameterType, string> = {
  text: 'Texto',
  number: 'Número',
  boolean: 'Sí/No',
};

interface ParameterRow {
  name: string;
  type: ParameterType;
  unit?: string;
}

interface EditAssetModalProps {
  visible: boolean;
  asset: Asset;
  onClose: () => void;
  onSubmit: (input: UpdateAssetInput) => Promise<void>;
}

export function EditAssetModal({ visible, asset, onClose, onSubmit }: EditAssetModalProps) {
  const [name, setName] = useState(asset.name);
  const [category, setCategory] = useState(asset.category);
  const [icon, setIcon] = useState<string | null>(asset.icon);
  const [parameters, setParameters] = useState<ParameterRow[]>(
    asset.parameter_definitions.map((p) => ({ name: p.name, type: p.type, unit: p.unit }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();

  const reset = () => {
    setName(asset.name);
    setCategory(asset.category);
    setIcon(asset.icon);
    setParameters(asset.parameter_definitions.map((p) => ({ name: p.name, type: p.type, unit: p.unit })));
    setSubmitting(false);
    setNameError(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addParameter = () => {
    setParameters((prev) => [...prev, { name: '', type: 'text' }]);
  };

  const updateParameterName = (index: number, value: string) => {
    setParameters((prev) => prev.map((p, i) => (i === index ? { ...p, name: value } : p)));
  };

  const updateParameterType = (index: number, type: ParameterType) => {
    setParameters((prev) => prev.map((p, i) => (i === index ? { ...p, type } : p)));
  };

  const confirmRemoveParameter = (index: number) => {
    const param = parameters[index];
    Alert.alert(
      'Eliminar parámetro',
      `¿Eliminar "${param.name || 'sin nombre'}"? Los registros históricos no se verán afectados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setParameters((prev) => prev.filter((_, i) => i !== index)),
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError('El nombre es obligatorio');
      return;
    }
    if (!category) return;

    setNameError(undefined);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        icon,
        parameter_definitions: parameters
          .filter((p) => p.name.trim())
          .map((p) => ({ name: p.name.trim(), type: p.type, ...(p.unit ? { unit: p.unit } : {}) })),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = name.trim().length > 0 && category.length > 0 && !submitting;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Editar Asset</Text>
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
                label="Nombre"
                value={name}
                onChangeText={setName}
                placeholder="Ej: Piscina, Auto, Obra del baño"
                error={nameError}
              />

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Categoría</Text>
                <View style={styles.pillRow}>
                  {ASSET_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      style={[styles.pill, category === cat && styles.pillActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Icono</Text>
                <View style={styles.iconGrid}>
                  {ASSET_ICONS.map((emoji) => (
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

              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>Parámetros</Text>
                  <Pressable onPress={addParameter} style={styles.addParamButton}>
                    <Text style={styles.addParamText}>+ Agregar</Text>
                  </Pressable>
                </View>

                {parameters.map((param, index) => (
                  <View key={index} style={styles.paramRow}>
                    <View style={styles.paramNameContainer}>
                      <Input
                        value={param.name}
                        onChangeText={(v) => updateParameterName(index, v)}
                        placeholder="Nombre del parámetro"
                      />
                    </View>
                    <View style={styles.typePills}>
                      {(Object.keys(PARAMETER_TYPE_LABELS) as ParameterType[]).map((type) => (
                        <Pressable
                          key={type}
                          style={[styles.typePill, param.type === type && styles.typePillActive]}
                          onPress={() => updateParameterType(index, type)}
                        >
                          <Text style={[styles.typePillText, param.type === type && styles.typePillTextActive]}>
                            {PARAMETER_TYPE_LABELS[type]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable
                      onPress={() => confirmRemoveParameter(index)}
                      style={styles.removeButton}
                      accessibilityLabel={`Eliminar parámetro ${param.name}`}
                    >
                      <Text style={styles.removeText}>✕</Text>
                    </Pressable>
                  </View>
                ))}

                {parameters.length === 0 && (
                  <Text style={styles.emptyParams}>Sin parámetros configurados.</Text>
                )}
              </View>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  pillActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pillText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.silverDim },
  pillTextActive: { color: Colors.bg, fontFamily: 'Inter_500Medium' },
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
  addParamButton: { paddingVertical: 4, paddingHorizontal: 8 },
  addParamText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.gold },
  paramRow: {
    gap: 8,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  paramNameContainer: { flex: 1 },
  typePills: { flexDirection: 'row', gap: 6 },
  typePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typePillActive: { borderColor: Colors.gold, backgroundColor: Colors.goldDim + '33' },
  typePillText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.silverDim },
  typePillTextActive: { color: Colors.gold, fontFamily: 'Inter_500Medium' },
  removeButton: { alignSelf: 'flex-end', padding: 4 },
  removeText: { fontSize: 14, color: '#c87a60' },
  emptyParams: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.silverMuted,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
