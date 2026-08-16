import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Asset } from '../../../types';
import { filterAssetsByName } from '../../../lib/filterAssets';

interface AssetPickerSheetProps {
  visible: boolean;
  assets: Asset[];
  onClose: () => void;
  onSelectAsset: (asset: Asset) => void;
}

export function AssetPickerSheet({ visible, assets, onClose, onSelectAsset }: AssetPickerSheetProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const filteredAssets = filterAssetsByName(assets, search);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const goToMantenimiento = () => {
    handleClose();
    router.push('/mantenimiento');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Elegir asset</Text>
            <Pressable onPress={handleClose} accessibilityLabel="Cerrar">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {assets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Todavía no creaste ningún asset.</Text>
              <Pressable onPress={goToMantenimiento} style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Ir a Mantenimiento</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar asset"
                placeholderTextColor={Colors.silverMuted}
              />

              <ScrollView style={styles.list}>
                {filteredAssets.map((asset) => (
                  <Pressable
                    key={asset.id}
                    style={styles.item}
                    onPress={() => {
                      setSearch('');
                      onSelectAsset(asset);
                    }}
                  >
                    <Text style={styles.itemName}>{asset.name}</Text>
                    <Text style={styles.itemCategory}>{asset.category}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
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
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 20,
    color: Colors.silver,
  },
  closeText: { fontSize: 16, color: Colors.silverDim },
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
  list: { gap: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemName: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.silver },
  itemCategory: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.silverMuted },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 14,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.silverDim,
    textAlign: 'center',
  },
  emptyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  emptyButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.gold,
  },
});
