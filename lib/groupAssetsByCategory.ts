import { Asset } from '../types';

export function groupAssetsByCategory<T extends Asset>(assets: T[]): Record<string, T[]> {
  return assets.reduce<Record<string, T[]>>((acc, asset) => {
    if (!acc[asset.category]) acc[asset.category] = [];
    acc[asset.category].push(asset);
    return acc;
  }, {});
}
