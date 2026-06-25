import { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAssetsWithLastEvent } from '../../hooks/useAssetsWithLastEvent';
import { groupAssetsByCategory } from '../../lib/groupAssetsByCategory';
import { getUniqueCategories } from '../../lib/getUniqueCategories';
import { AssetCard } from '../../components/modules/assets/AssetCard';
import { EmptyState } from '../../components/modules/assets/EmptyState';
import { CreateAssetModal } from '../../components/modules/assets/CreateAssetModal';

const ALL_FILTER = 'Todos';

export default function HomeScreen() {
  const router = useRouter();
  const { assets, loading, error, createAsset } = useAssetsWithLastEvent();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_FILTER);

  const categories = useMemo(() => getUniqueCategories(assets), [assets]);

  const filteredAssets = useMemo(() => {
    if (selectedCategory === ALL_FILTER) return assets;
    return assets.filter((a) => a.category === selectedCategory);
  }, [assets, selectedCategory]);

  const grouped = useMemo(() => groupAssetsByCategory(filteredAssets), [filteredAssets]);
  const groupKeys = Object.keys(grouped);

  const showFilter = categories.length > 1;
  const filterOptions = [ALL_FILTER, ...categories];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error al cargar los assets</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {assets.length === 0 ? (
        <EmptyState onCreatePress={() => setModalVisible(true)} />
      ) : (
        <>
          {showFilter && (
            <View style={styles.filterBar}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={filterOptions}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.filterContent}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.filterChip,
                      selectedCategory === item && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedCategory(item)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategory === item && styles.filterChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          )}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {groupKeys.map((category) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryLabel}>{category}</Text>
                <View style={styles.assetList}>
                  {grouped[category].map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onPress={() => router.push(`/assets/${asset.id}`)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {assets.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Crear nuevo asset"
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      )}

      <CreateAssetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={async (input) => { await createAsset(input); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.silverDim,
  },
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  filterChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  filterChipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.silverDim,
  },
  filterChipTextActive: {
    color: Colors.bg,
    fontFamily: 'Inter_500Medium',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 28,
    paddingBottom: 100,
  },
  categorySection: {
    gap: 12,
  },
  categoryLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.silverMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  assetList: {
    gap: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  fabIcon: {
    fontSize: 28,
    color: Colors.bg,
    lineHeight: 32,
    fontFamily: 'Inter_400Regular',
  },
});
