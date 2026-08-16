import { Asset } from '../types';

export function filterAssetsByName(assets: Asset[], query: string): Asset[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return assets;
  return assets.filter((a) => a.name.toLowerCase().includes(normalized));
}
