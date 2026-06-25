import { AssetWithLastEvent } from '../types';

export function getUniqueCategories(assets: AssetWithLastEvent[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const asset of assets) {
    if (!seen.has(asset.category)) {
      seen.add(asset.category);
      result.push(asset.category);
    }
  }
  return result;
}
