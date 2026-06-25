import { Asset, AssetWithLastEvent } from '../types';

interface EventSummary {
  asset_id: string;
  date: string;
  notes: string | null;
}

export function mergeLastEvents(assets: Asset[], events: EventSummary[]): AssetWithLastEvent[] {
  const lastEventByAsset = new Map<string, { date: string; notes: string | null }>();

  for (const event of events) {
    if (!lastEventByAsset.has(event.asset_id)) {
      lastEventByAsset.set(event.asset_id, { date: event.date, notes: event.notes });
    }
  }

  return assets.map((asset) => ({
    ...asset,
    lastEvent: lastEventByAsset.get(asset.id) ?? null,
  }));
}
