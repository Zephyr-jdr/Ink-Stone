import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Graph from 'graphology';
import Sigma from 'sigma';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import { createNodeBorderProgram } from '@sigma/node-border';
import {
  buildLocationColorMap,
  getCharacterColor,
  getRelationColor,
  hexToRgba,
  nodeSize,
} from '@/lib/graphPalette';
import { getRelationType } from '@/lib/constants';
import { useT } from '@/i18n';
import type { Character, Location, Relation } from '@/types';

import type { ForceSettings } from './forceSettings';

export type { ForceSettings } from './forceSettings';
export { DEFAULT_FORCE_SETTINGS } from './forceSettings';

interface SigmaGraphProps {
  characters: Character[];
  relations: Relation[];
  locations: Location[];
  visibleCharacterIds?: Set<string>;
  visibleRelationTypes?: Set<string>;
  forces: ForceSettings;
  reseedToken?: number;
}


const EDGE_SIZE_BASE = 2.5;
const EDGE_SIZE_FOCUS = 5;
const EDGE_ALPHA_BASE = 0.85;
const EDGE_ALPHA_FADE = 0.04;
const NODE_ALPHA_FADE = 0.15;


interface SimNode extends SimulationNodeDatum {
  id: string;
}
type SimLink = SimulationLinkDatum<SimNode>;


export function SigmaGraph({
  characters,
  relations,
  locations,
  visibleCharacterIds,
  visibleRelationTypes,
  forces,
  reseedToken = 0,
}: SigmaGraphProps) {
  const t = useT();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<Map<string, SimNode>>(new Map());
  const hoveredRef = useRef<string | null>(null);
  const adjacencyRef = useRef<Map<string, Set<string>>>(new Map());
  const draggedNodeRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);


  const forcesRef = useRef<ForceSettings>(forces);
  useEffect(() => {
    forcesRef.current = forces;
  }, [forces]);


  useEffect(() => {
    if (!containerRef.current) return;

  
    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }
    if (simRef.current) {
      simRef.current.stop();
      simRef.current = null;
    }

    const colorMap = buildLocationColorMap(locations);
    const g = new Graph({ multi: false, type: 'undirected' });
    const charById = new Map(characters.map((c) => [c.id, c]));

    const visible = visibleCharacterIds ?? new Set(characters.map((c) => c.id));

    const visibleRelations = relations.filter((r) => {
      if (!visible.has(r.from_character_id) || !visible.has(r.to_character_id)) return false;
      if (visibleRelationTypes && !visibleRelationTypes.has(r.relation_type)) return false;
      return true;
    });

  
    const adjacency = new Map<string, Set<string>>();
    visibleRelations.forEach((r) => {
      if (!adjacency.has(r.from_character_id)) adjacency.set(r.from_character_id, new Set());
      if (!adjacency.has(r.to_character_id)) adjacency.set(r.to_character_id, new Set());
      adjacency.get(r.from_character_id)!.add(r.to_character_id);
      adjacency.get(r.to_character_id)!.add(r.from_character_id);
    });
    adjacencyRef.current = adjacency;

   
    const degree = new Map<string, number>();
    visibleRelations.forEach((r) => {
      degree.set(r.from_character_id, (degree.get(r.from_character_id) || 0) + 1);
      degree.set(r.to_character_id, (degree.get(r.to_character_id) || 0) + 1);
    });

   
    const visibleChars = characters.filter((c) => visible.has(c.id));
    const simNodes: SimNode[] = [];
    const simNodeMap = new Map<string, SimNode>();

    visibleChars.forEach((c, i) => {
      const angle = (i / Math.max(visibleChars.length, 1)) * Math.PI * 2;
      const radius = 200;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const isPJ = c.type === 'PJ';
      const color = getCharacterColor(c, colorMap);
      const attrs: Record<string, unknown> = {
        label: c.name,
        x,
        y,
        size: nodeSize(degree.get(c.id) || 0, isPJ),
        color,
        nodeKind: c.type,
        location: c.location,
      };
      if (isPJ) {
        attrs.type = 'circle-border';
        attrs.borderColor = '#D4A84B';
      }
      g.addNode(c.id, attrs);

    
      const simNode: SimNode = { id: c.id, x, y };
      simNodes.push(simNode);
      simNodeMap.set(c.id, simNode);
    });

    simNodesRef.current = simNodeMap;

    
    const simLinks: SimLink[] = [];
    visibleRelations.forEach((r) => {
      const from = charById.get(r.from_character_id);
      const to = charById.get(r.to_character_id);
      if (!from || !to) return;
      if (g.hasEdge(r.from_character_id, r.to_character_id)) return;
      const key = [r.from_character_id, r.to_character_id].sort().join('|');
      const baseColor = getRelationColor(r);
      const typeLabel = getRelationType(r.relation_type).label;
      const detail = r.relation_detail?.trim() || typeLabel;
      g.addEdgeWithKey(key, r.from_character_id, r.to_character_id, {
        _label: detail,
        _baseColor: baseColor,
        color: hexToRgba(baseColor, EDGE_ALPHA_BASE),
        size: EDGE_SIZE_BASE,
        relationType: r.relation_type,
      });
      simLinks.push({
        source: simNodeMap.get(r.from_character_id)!,
        target: simNodeMap.get(r.to_character_id)!,
      });
    });

    graphRef.current = g;

    if (g.order === 0) return;

    
    const renderer = new Sigma(g, containerRef.current, {
      renderEdgeLabels: true,
      defaultNodeColor: '#9C9385',
      defaultEdgeColor: '#999088',
      labelColor: { color: '#2C2C2C' },
      edgeLabelColor: { color: '#2C2C2C' },
      labelSize: 13,
      edgeLabelSize: 12,
      labelFont: "'Inter', system-ui, sans-serif",
      edgeLabelFont: "'Inter', system-ui, sans-serif",
      labelWeight: '500',
      edgeLabelWeight: '600',
      labelDensity: 0.7,
      labelGridCellSize: 60,
      labelRenderedSizeThreshold: 7,
      enableEdgeEvents: false,
      nodeProgramClasses: {
        'circle-border': createNodeBorderProgram({
          borders: [
            { size: { value: 2 }, color: { attribute: 'borderColor' } },
            { size: { fill: true }, color: { attribute: 'color' } },
          ],
        }),
      },
      nodeReducer: (key, attrs) => {
        const out: Record<string, unknown> = { ...attrs };
        const hovered = hoveredRef.current;
        if (hovered) {
          const focus = key === hovered || adjacencyRef.current.get(hovered)?.has(key);
          if (!focus) {
            out.color = hexToRgba((attrs.color as string) || '#9C9385', NODE_ALPHA_FADE);
            out.label = '';
          } else if (key === hovered) {
            out.zIndex = 2;
          }
        }
        return out;
      },
      edgeReducer: (key, attrs) => {
        const out: Record<string, unknown> = { ...attrs };
        const hovered = hoveredRef.current;
        const baseColor = (attrs._baseColor as string) || '#999088';
        if (hovered) {
          const [s, t] = g.extremities(key);
          const involves = s === hovered || t === hovered;
          if (involves) {
            out.color = hexToRgba(baseColor, 1);
            out.size = EDGE_SIZE_FOCUS;
            out.label = (attrs._label as string) || '';
            out.forceLabel = true;
            out.zIndex = 3;
          } else {
            out.color = hexToRgba(baseColor, EDGE_ALPHA_FADE);
            out.size = EDGE_SIZE_BASE * 0.5;
            out.label = '';
          }
        } else {
          out.color = hexToRgba(baseColor, EDGE_ALPHA_BASE);
          out.size = EDGE_SIZE_BASE;
          out.label = '';
        }
        return out;
      },
    });

    sigmaRef.current = renderer;

    // ----- Simulation d3-force ---------------------------------------
    const f = forcesRef.current;
    const sim = forceSimulation<SimNode, SimLink>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((n) => n.id)
          .distance(f.linkDistance)
          .strength(f.linkForce)
      )
      .force('charge', forceManyBody().strength(-f.repelForce))
      .force('center', forceCenter(0, 0).strength(f.centerForce))
      // collision pour éviter le chevauchement visuel
      .force('collide', forceCollide<SimNode>(12))
      // alphaDecay 0.0228 par défaut → ~300 ticks ≈ 5 s avant repos
      .alphaDecay(0.03)
      .alphaMin(0.005);

   
    sim.on('tick', () => {
      simNodes.forEach((n) => {
        if (n.x !== undefined) g.setNodeAttribute(n.id, 'x', n.x);
        if (n.y !== undefined) g.setNodeAttribute(n.id, 'y', n.y);
      });
      renderer.refresh();
    });

   
    if (f.frozen) sim.alpha(0).stop();

    simRef.current = sim;

   

    renderer.on('clickNode', ({ node }) => {
      // Empêche un click parasite après un drag réel
      if (isDraggingRef.current) return;
      navigate(`/character/${node}`);
    });

    renderer.on('enterNode', ({ node }) => {
      hoveredRef.current = node;
      renderer.refresh();
      if (containerRef.current) containerRef.current.style.cursor = 'pointer';
    });

    renderer.on('leaveNode', () => {
      hoveredRef.current = null;
      renderer.refresh();
      if (containerRef.current) containerRef.current.style.cursor = 'default';
    });

   
    renderer.on('downNode', ({ node, event }) => {
      draggedNodeRef.current = node;
      isDraggingRef.current = false; // deviendra true au premier mousemove
      const sn = simNodesRef.current.get(node);
      if (sn) {
        sn.fx = sn.x;
        sn.fy = sn.y;
      }
      
      const s = simRef.current;
      if (s && !forcesRef.current.frozen) {
        s.alphaTarget(0.3).restart();
      }
      
      event.preventSigmaDefault();
      event.original.preventDefault();
      event.original.stopPropagation();
    });

     const mouseCaptor = renderer.getMouseCaptor();

    const onMouseMove = (e: { x: number; y: number; preventSigmaDefault: () => void }) => {
      if (!draggedNodeRef.current) return;
      isDraggingRef.current = true;
      const pos = renderer.viewportToGraph({ x: e.x, y: e.y });
      const sn = simNodesRef.current.get(draggedNodeRef.current);
      if (sn) {
        sn.fx = pos.x;
        sn.fy = pos.y;
      }
      e.preventSigmaDefault();
    };
    mouseCaptor.on('mousemovebody', onMouseMove);

    const stopDrag = () => {
      const id = draggedNodeRef.current;
      if (!id) return;
      const sn = simNodesRef.current.get(id);
      if (sn) {
        sn.fx = null;
        sn.fy = null;
      }
      const s = simRef.current;
      if (s) s.alphaTarget(0); 
      draggedNodeRef.current = null;
     
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    };
     mouseCaptor.on('mouseup', stopDrag);
    
    window.addEventListener('mouseup', stopDrag);

    // -------------------------------------------------------------------
    // Support tactile — Sigma v3 a un TouchCaptor distinct du MouseCaptor.
    // Sans ces handlers, le drag ne fonctionne pas au doigt sur mobile :
    // `downNode` fire bien (Sigma le routes via les deux capteurs), mais
    // `mousemovebody`/`mouseup` ne sortent JAMAIS du MouseCaptor en touch.
    // -------------------------------------------------------------------
    const touchCaptor = renderer.getTouchCaptor();

    // Type local : le payload `touchmoves` expose la liste des doigts en
    // coords viewport. On ne typecase pas via les types officiels Sigma
    // pour éviter les régressions de typage entre versions mineures.
    const onTouchMove = (e: { touches: Array<{ x: number; y: number }> }) => {
      if (!draggedNodeRef.current) return;
      // Si l'utilisateur passe à 2 doigts (pinch-zoom), on n'interprète
      // plus le mouvement comme un drag — Sigma garde la main sur le pinch.
      if (e.touches.length !== 1) return;
      isDraggingRef.current = true;
      const { x, y } = e.touches[0];
      const pos = renderer.viewportToGraph({ x, y });
      const sn = simNodesRef.current.get(draggedNodeRef.current);
      if (sn) {
        sn.fx = pos.x;
        sn.fy = pos.y;
      }
    };
    // NB: nom d'event = `touchmovebody` (cohérent avec `mousemovebody`).
    // L'event `touchmove` brut, lui, est filtré par Sigma quand le geste
    // débute hors d'un nœud : on prend le `body` qui fire dans tous les cas.
    touchCaptor.on('touchmovebody', onTouchMove);

    touchCaptor.on('touchup', stopDrag);
    // Filets de sécurité au cas où l'event remonte hors du canvas
    // (geste qui sort de la zone, bascule d'app, etc.)
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchcancel', stopDrag);

    return () => {
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
      window.removeEventListener('touchcancel', stopDrag);
      sim.stop();
      simRef.current = null;
      renderer.kill();
      sigmaRef.current = null;
    };

  }, [
    characters,
    relations,
    locations,
    visibleCharacterIds,
    visibleRelationTypes,
    navigate,
  ]);

 
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;

    // forceLink
    const linkForceObj = sim.force('link') as ReturnType<typeof forceLink<SimNode, SimLink>> | undefined;
    if (linkForceObj) {
      linkForceObj.distance(forces.linkDistance).strength(forces.linkForce);
    }
   
    const chargeForceObj = sim.force('charge') as ReturnType<typeof forceManyBody> | undefined;
    if (chargeForceObj) {
      chargeForceObj.strength(-forces.repelForce);
    }
   
    const centerForceObj = sim.force('center') as ReturnType<typeof forceCenter> | undefined;
    if (centerForceObj) {
      centerForceObj.strength(forces.centerForce);
    }

    if (forces.frozen) {
      sim.alpha(0).stop();
    } else {
      sim.alpha(Math.max(sim.alpha(), 0.2)).restart();
    }
  }, [forces]);

 
  useEffect(() => {
    if (reseedToken === 0) return;
    const g = graphRef.current;
    const sim = simRef.current;
    if (!g || !sim) return;

    simNodesRef.current.forEach((n) => {
      n.x = (Math.random() - 0.5) * 400;
      n.y = (Math.random() - 0.5) * 400;
      n.vx = 0;
      n.vy = 0;
      
      n.fx = null;
      n.fy = null;
      g.setNodeAttribute(n.id, 'x', n.x);
      g.setNodeAttribute(n.id, 'y', n.y);
    });
    sigmaRef.current?.refresh();
    if (!forcesRef.current.frozen) {
      sim.alpha(1).restart();
    }
  }, [reseedToken]);

  if (characters.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] font-body italic">
        {t('graph.empty')}

      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      // `touchAction: 'none'` empêche le browser d'intercepter les gestes
      // tactiles (scroll vertical, pinch-zoom natif) — Sigma gère son
      // propre pinch-zoom et le drag de nœuds via le TouchCaptor.
      style={{ cursor: 'default', touchAction: 'none' }}
    />
  );

}
