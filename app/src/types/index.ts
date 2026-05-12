export interface Trait {
  label: string;
  checked: boolean;
}

/**
 * Lieu personnalisable. Le MJ choisit le nom et la couleur.
 * Chaque grimoire (`space`) a sa propre liste de lieux.
 * `Character.location` stocke l'`id` de la Location (et plus son nom).
 */
export interface Location {
  id: string;
  space_id: string;
  name: string;
  /** Couleur en hex (ex : "#7AA177"). Utilisée partout (chip, fiche, graph). */
  color: string;
  created_at: string;
}

export interface Character {
  id: string;
  space_id: string;
  name: string;
  role: string;
  type: 'PJ' | 'PNJ';
  /**
   * ID d'une `Location` du même `space`. Optionnel (un personnage peut être
   * "sans lieu connu"). Pour les anciens enregistrements stockant un nom de
   * lieu en clair, la migration au chargement remplace par l'`id` correspondant.
   */
  location?: string;
  notes: string;
  traits: Trait[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Relation {
  id: string;
  space_id: string;
  from_character_id: string;
  to_character_id: string;
  /**
   * ID d'un type de relation parmi `RELATION_TYPES` (`ami`, `ennemi`, etc.).
   * Pour les anciens enregistrements en texte libre, la migration au chargement
   * remappe par mots-clés vers l'id le plus probable (`autre` en fallback).
   */
  relation_type: string;
  /** Optionnel : précision libre ("ami d'enfance", "rival depuis la chasse au sanglier"…). */
  relation_detail?: string;
  created_at: string;
}

export interface Space {
  id: string;
  name: string;
  invite_code: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceSession {
  space: Space;
  isAdmin: boolean;
  token: string;
}
