/**
 * Réglages de la simulation d3-force du graphe — calqués 1-pour-1 sur
 * les sliders d'Obsidian (cf. screenshot fourni par l'utilisateur).
 *
 * Mapping vers d3-force :
 *  - `centerForce`   → `d3.forceCenter().strength(centerForce)`
 *                      Force qui rappelle les nœuds vers (0, 0).
 *  - `repelForce`    → `d3.forceManyBody().strength(-repelForce)`
 *                      Charge négative = répulsion entre nœuds.
 *  - `linkForce`     → `forceLink.strength(linkForce)`
 *                      Force des arêtes (rigidité du ressort).
 *  - `linkDistance`  → `forceLink.distance(linkDistance)`
 *                      Longueur cible des arêtes (en unités graph).
 *
 * Bornes choisies pour rester dans une zone sensible et reproduire le
 * feel d'Obsidian sur un graphe ~10–50 nœuds.
 */
export interface ForceSettings {
  /** Force de centre. 0..1. Plus haut = nœuds plus serrés au centre. */
  centerForce: number;
  /** Force de répulsion (charge). 50..1000. Plus haut = nœuds plus écartés. */
  repelForce: number;
  /** Force de liaison (rigidité). 0..1. Plus haut = arêtes plus tendues. */
  linkForce: number;
  /** Distance cible des liens. 10..300. */
  linkDistance: number;
  /** simulation gelée (alpha = 0 forcé). */
  frozen: boolean;
}

export const DEFAULT_FORCE_SETTINGS: ForceSettings = {
  centerForce: 0.1,
  repelForce: 250,
  linkForce: 0.6,
  linkDistance: 80,
  frozen: false,
};

/** Bornes des sliders, exposées pour la sidebar. */
export const FORCE_BOUNDS = {
  centerForce:  { min: 0,   max: 1,    step: 0.01 },
  repelForce:   { min: 50,  max: 1000, step: 10   },
  linkForce:    { min: 0,   max: 1,    step: 0.05 },
  linkDistance: { min: 10,  max: 300,  step: 5    },
} as const;
