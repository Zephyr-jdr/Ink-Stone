export const COLORS = {
  bgPrimary: '#EBE5DA',
  bgSecondary: '#E0D8CA',
  bgCard: '#FFFFFF',
  bgCardAlt: '#F5F1EA',
  textPrimary: '#2C2C2C',
  textSecondary: '#5A5A5A',
  textMuted: '#8C8279',
  textInverse: '#FFFFFF',
  borderSubtle: '#D6CFC4',
  borderFocus: '#2C2C2C',
  accentPrimary: '#2C2C2C',
  accentHover: '#000000',
  tagBg: '#EBE5DA',
  tagText: '#5A5A5A',
  ink: '#1B1B1B',
  parchment: '#F5F1EA',
  paper: '#F5F2EC',
  paperTextured: '#E9E2D1',
  graphLine: '#8C8279',
  graphNodeBg: '#F5F1EA',
  graphNodeBorder: '#2C2C2C',
} as const;

export const FONTS = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
} as const;


export interface RelationType {
  id: string;
  /** EN fallback label. Use `useRelationLabel(id)` in UI to get translated. */
  label: string;
  /** i18n key under `relation.*`. */
  labelKey: string;
  /** Edge colour in the graph. */
  color: string;
}

export const RELATION_TYPES: RelationType[] = [
  { id: 'ami',          label: 'Friend / Ally',  labelKey: 'relation.friend',       color: '#5A8C5A' },
  { id: 'famille',      label: 'Family',         labelKey: 'relation.family',       color: '#4A6FA5' },
  { id: 'mentor',       label: 'Mentor',         labelKey: 'relation.mentor',       color: '#7B5DAA' },
  { id: 'compagnon',    label: 'Companion',      labelKey: 'relation.companion',    color: '#3F8B8B' },
  { id: 'rival',        label: 'Rival',          labelKey: 'relation.rival',        color: '#C77744' },
  { id: 'ennemi',       label: 'Enemy',          labelKey: 'relation.enemy',        color: '#9B3A2D' },
  { id: 'romance',      label: 'Romance',        labelKey: 'relation.romance',      color: '#C25A77' },
  { id: 'connaissance', label: 'Acquaintance',   labelKey: 'relation.acquaintance', color: '#999088' },
  { id: 'autre',        label: 'Other',          labelKey: 'relation.other',        color: '#1B1B1B' },
];


/** Map id → RelationType pour lookup O(1). */
export const RELATION_TYPES_BY_ID: Record<string, RelationType> = Object.fromEntries(
  RELATION_TYPES.map((r) => [r.id, r])
);

/** Retourne le RelationType pour un id, fallback `autre`. */
export function getRelationType(id: string | undefined): RelationType {
  if (!id) return RELATION_TYPES_BY_ID.autre;
  return RELATION_TYPES_BY_ID[id] ?? RELATION_TYPES_BY_ID.autre;
}

/**
 * Migration douce : ancien `relation_type` en texte libre → id fermé.
 * Mapping par mots-clés FR. Fallback sur `autre`.
 */
export function migrateRelationType(legacy: string | undefined): string {
  if (!legacy) return 'autre';
  if (RELATION_TYPES_BY_ID[legacy]) return legacy; // déjà migré
  const t = legacy.toLowerCase();
  if (/(ami|alli[ée]|allie|compagnon)/.test(t)) {
    if (/compagnon/.test(t)) return 'compagnon';
    return 'ami';
  }
  if (/(famille|fr[èe]re|s[oœ]ur|p[èe]re|m[èe]re|fils|fille|cousin|oncle|tante)/.test(t)) return 'famille';
  if (/(mentor|ma[îi]tre|prot[ée]g[ée]|protege|apprenti)/.test(t)) return 'mentor';
  if (/(rival|m[ée]fiance|m[ée]fiant|jaloux|concurrent)/.test(t)) return 'rival';
  if (/(ennemi|antagonist|adversaire|haine)/.test(t)) return 'ennemi';
  if (/(amour|amant|amante|romance|fianc[ée]|conjoint|[ée]poux|[ée]pouse)/.test(t)) return 'romance';
  if (/(connaissance|voisin|client|connait)/.test(t)) return 'connaissance';
  return 'autre';
}

export const APP_NAME = 'Ink & Stone';

export const STONETOP_PLAYBOOK_LOCATIONS: { name: string; color: string }[] = [
  { name: 'Stonetop',       color: '#7AA177' }, // vert mousse
  { name: 'Marshedge',      color: '#7DA1B0' }, // bleu marais
  { name: "Gordin's Delve", color: '#C8945C' }, // ocre cuivre
  { name: 'Steplands',      color: '#C97C6B' }, // rouge brique
  { name: 'Lygos',          color: '#D4A84B' }, // or doré
  { name: 'Manmarch',       color: '#8E6BAA' }, // violet pourpre
];

/** Couleur fallback gris parchemin pour personnage sans lieu. */
export const FALLBACK_LOCATION_COLOR = '#9C9385';

/** Palette par défaut proposée dans le color-picker pour créer un nouveau lieu. */
export const DEFAULT_LOCATION_PALETTE: string[] = [
  '#7AA177', // vert mousse
  '#7DA1B0', // bleu marais
  '#C8945C', // ocre cuivre
  '#C97C6B', // rouge brique
  '#D4A84B', // or doré
  '#8E6BAA', // violet pourpre
  '#5A8C5A', // vert sage
  '#4A6FA5', // bleu indigo
  '#C25A77', // rose vieilli
  '#3F8B8B', // sarcelle
  '#7B5DAA', // violet sagesse
  '#9C9385', // gris parchemin
];
