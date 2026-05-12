import { FALLBACK_LOCATION_COLOR, getRelationType } from './constants';
import type { Character, Location, Relation } from '@/types';

/**
 * Helpers de palette pour la vue Graphe.
 * Centralise les calculs de couleur des nœuds (lieu) et arêtes (type de relation).
 */

/**
 * Map { locationId → color } pour lookup O(1) lors du build du graph.
 * Inclut une entrée vide pour les personnages sans lieu.
 */
export function buildLocationColorMap(locations: Location[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const loc of locations) map[loc.id] = loc.color;
  return map;
}

export function getCharacterColor(
  character: Pick<Character, 'location'>,
  colorMap: Record<string, string>
): string {
  if (!character.location) return FALLBACK_LOCATION_COLOR;
  return colorMap[character.location] ?? FALLBACK_LOCATION_COLOR;
}

export function getRelationColor(relation: Pick<Relation, 'relation_type'>): string {
  return getRelationType(relation.relation_type).color;
}

/**
 * Convertit un hex en rgba avec alpha donné. Utile pour le halo des PJ
 * et le fade des nœuds non-focus au hover.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const full =
    cleaned.length === 3
      ? cleaned.split('').map((c) => c + c).join('')
      : cleaned;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Taille (rayon) d'un nœud, fixe selon le type.
 * PJ légèrement plus gros (et entourés d'un halo doré côté rendu Sigma).
 * Pas d'amplification par le degré : la lecture du graph reste constante.
 */
export function nodeSize(_degree: number, isPJ: boolean): number {
  return isPJ ? 9 : 6;
}
