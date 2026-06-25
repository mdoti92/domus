import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAssets } from '../../hooks/useAssets';
import { groupAssetsByCategory } from '../../lib/groupAssetsByCategory';
import { AssetCard } from '../../components/modules/assets/AssetCard';
import { EmptyState } from '../../components/modules/assets/EmptyState';
import { CreateAssetModal } from '../../components/modules/assets/CreateAssetModal';

export default function HomeScreen() {
  const router = useRouter();
  const { assets, loading, error, createAsset } = useAssets();
  const [modalVisible, setModalVisible] = useState(false);

  const grouped = groupAssetsByCategory(assets);
  const categories = Object.keys(grouped);

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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((category) => (
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
