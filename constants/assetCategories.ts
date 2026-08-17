export const ASSET_CATEGORIES = ['Mantenimiento', 'Médico', 'Obra'] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const MEDICAL_CATEGORY: AssetCategory = 'Médico';
