import { Pressable, View, StyleSheet, Text } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Asset } from '../../../types';

interface AssetCardProps {
  asset: Asset;
  onPress: () => void;
}

export function AssetCard({ asset, onPress }: AssetCardProps) {
  const paramCount = asset.parameter_definitions.length;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={asset.name}
    >
      {asset.icon ? (
        <Text style={styles.icon}>{asset.icon}</Text>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{asset.name}</Text>
        {paramCount > 0 && (
          <Text style={styles.params}>
            {paramCount} parámetro{paramCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.75,
  },
  icon: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: Colors.silver,
  },
  params: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.silverMuted,
  },
  chevron: {
    fontSize: 22,
    color: Colors.goldDim,
    lineHeight: 26,
  },
});
