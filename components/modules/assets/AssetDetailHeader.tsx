import { View, StyleSheet, Text } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Asset } from '../../../types';

interface AssetDetailHeaderProps {
  asset: Asset;
}

const PARAM_TYPE_LABEL: Record<string, string> = {
  number: 'número',
  text: 'texto',
  boolean: 'sí/no',
};

export function AssetDetailHeader({ asset }: AssetDetailHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.heroRow}>
        {asset.icon ? (
          <Text style={styles.icon}>{asset.icon}</Text>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{asset.name}</Text>
          <Text style={styles.category}>{asset.category}</Text>
        </View>
      </View>

      {asset.parameter_definitions.length > 0 && (
        <View style={styles.paramsSection}>
          <Text style={styles.sectionLabel}>Parámetros</Text>
          <View style={styles.paramsList}>
            {asset.parameter_definitions.map((param) => (
              <View key={param.name} style={styles.paramChip}>
                <Text style={styles.paramName}>{param.name}</Text>
                <Text style={styles.paramType}>
                  {PARAM_TYPE_LABEL[param.type]}
                  {param.unit ? ` · ${param.unit}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  icon: {
    fontSize: 48,
    width: 64,
    textAlign: 'center',
  },
  iconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 32,
    lineHeight: 38,
    color: Colors.silver,
  },
  category: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.silverDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  paramsSection: {
    gap: 10,
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.silverMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  paramsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paramChip: {
    backgroundColor: Colors.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 2,
  },
  paramName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.silver,
  },
  paramType: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.silverMuted,
  },
});
