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
  // Double-tap pour ouvrir la fiche sur mobile (le hover n'existe pas en
  // tactile). 1er tap : highlight des liens directs. 2e tap dans le même
  // nœud sous DOUBLE_TAP_MS : navigation. Tap ailleurs : highlight transféré.
  const lastTapNodeRef = useRef<string | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  // Timestamp du dernier event tactile. Sigma émet un `clickNode`
  // synthétique après chaque tap (ghost click) qui déclencherait la
  // navigation au 1er tap, court-circuitant le pattern double-tap.
  // On filtre `clickNode` dans la fenêtre [touchend ; touchend + 500ms].
  const lastTouchAtRef = useRef<number>(0);
  // Position de départ du geste (touch ou mouse) — sert au seuil de
  // mouvement qui distingue un TAP d'un DRAG. Sans ce seuil, le micro-
  // mouvement involontaire du doigt entre touchstart et touchend
  // (toujours 2-3 px en pratique) flagge à tort `isDraggingRef = true`
  // et casse la détection de double-tap.
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);





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
      // Ghost click post-tap : Sigma émet un `clickNode` synthétique
      // après chaque touchend (≈ 100-300ms plus tard). On l'ignore dans
      // une fenêtre de 500ms après le dernier event tactile, pour que
      // la logique double-tap d'`onTouchEndNative` garde la main.
      // Sur desktop, lastTouchAtRef = 0 → cette branche est inactive.
      if (Date.now() - lastTouchAtRef.current < 500) return;
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

   
    const camera = renderer.getCamera();

    
    const beginDragOn = (node: string) => {
      draggedNodeRef.current = node;
      isDraggingRef.current = false;
      const sn = simNodesRef.current.get(node);
      if (sn) {
        sn.fx = sn.x;
        sn.fy = sn.y;
      }
      camera.enabledPanning = false;          // ← bloque le pan caméra
      const s = simRef.current;
      if (s && !forcesRef.current.frozen) {
        s.alphaTarget(0.3).restart();
      }
    };

    // Seuil en pixels viewport pour distinguer un TAP d'un DRAG. En dessous,
    // on n'active PAS isDraggingRef et on ne déplace PAS le nœud — c'est
    // un tap (ou un long-press immobile). Au-dessus, c'est un drag.
    const DRAG_THRESHOLD_PX = 10;

    renderer.on('downNode', ({ node, event }) => {
      beginDragOn(node);
      // Mémorise la position de départ pour appliquer le seuil au prochain
      // mousemovebody (pareil que pour le touch).
      dragStartRef.current = { x: event.x, y: event.y };
      event.preventSigmaDefault();
      event.original.preventDefault();
      event.original.stopPropagation();
    });


     const mouseCaptor = renderer.getMouseCaptor();

    const onMouseMove = (e: { x: number; y: number; preventSigmaDefault: () => void }) => {
      if (!draggedNodeRef.current) return;
      const start = dragStartRef.current;
      if (start) {
        const dx = e.x - start.x;
        const dy = e.y - start.y;
        // Sous le seuil → on ignore (c'est un click immobile, pas un drag)
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
          e.preventSigmaDefault();
          return;
        }
      }
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
      // On ré-active TOUJOURS le pan, même si on n'avait pas de drag actif —
      // évite que la caméra reste figée si une exception interrompt le flow.
      camera.enabledPanning = true;
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
    // Support tactile — bypass complet du TouchCaptor de Sigma.
    //
    // L'API events de Sigma v3 (`touchmovebody`, `touchdown`, …) n'est
    // pas fiable selon les builds : payload variable, events parfois non
    // émis. On branche donc directement les events DOM natifs sur le
    // container du canvas. Avantages :
    //   - `touchmove` natif fire à chaque frame, sans filtrage
    //   - `preventDefault()` natif bloque proprement le pan TouchCaptor
    //     EN AMONT (à condition que le listener soit `passive: false`)
    //   - 100% prévisible cross-version Sigma
    // -------------------------------------------------------------------
    const el = containerRef.current!;

    // Convertit un Touch en coords *relatives au canvas* (Sigma attend
    // ces coords-là, pas les coords clientX/Y absolues).
    const getTouchPoint = (touch: Touch) => {
      const rect = el.getBoundingClientRect();
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    // Hit-test : trouve le nœud sous le doigt (rayon adapté au zoom).
    const hitTestAt = (viewportX: number, viewportY: number): string | null => {
      const graphPos = renderer.viewportToGraph({ x: viewportX, y: viewportY });
      const ratio = camera.getState().ratio;
      // 25 unités graph à zoom 1, borné pour éviter les extrêmes.
      const HIT_RADIUS = Math.max(15, Math.min(80, 25 * ratio));
      const hr2 = HIT_RADIUS * HIT_RADIUS;
      let nearest: string | null = null;
      let minD2 = hr2;
      simNodesRef.current.forEach((sn, id) => {
        if (sn.x === undefined || sn.y === undefined) return;
        const dx = sn.x - graphPos.x;
        const dy = sn.y - graphPos.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < minD2) { minD2 = d2; nearest = id; }
      });
      return nearest;
    };

    const onTouchStartNative = (e: TouchEvent) => {
      if (e.touches.length !== 1) return; // pinch → on laisse Sigma gérer
      const { x, y } = getTouchPoint(e.touches[0]);
      const node = hitTestAt(x, y);
      if (node) {
        // On bloque DÈS LE START le pan TouchCaptor : sans ça, Sigma
        // mémorise déjà le startCameraState et démarre le pan dans la
        // foulée. preventDefault() empêche aussi la sélection de texte.
        e.preventDefault();
        e.stopPropagation();
        beginDragOn(node);
        // Mémorise la position de départ pour le seuil DRAG_THRESHOLD_PX.
        dragStartRef.current = { x, y };
      } else if (hoveredRef.current) {

        // Tap sur le fond avec un highlight actif → on désactive.
        // Pas de preventDefault ici : on laisse Sigma faire son pan caméra
        // si l'utilisateur enchaîne sur un drag du fond.
        hoveredRef.current = null;
        lastTapNodeRef.current = null;
        lastTapTimeRef.current = 0;
        renderer.refresh();
      }
    };


    const onTouchMoveNative = (e: TouchEvent) => {
      if (!draggedNodeRef.current) return;
      if (e.touches.length !== 1) return;
      // CRUCIAL : preventDefault() ne marche que parce que le listener
      // est ajouté avec `{ passive: false }` (cf. plus bas).
      e.preventDefault();
      e.stopPropagation();
      const { x, y } = getTouchPoint(e.touches[0]);

      // Seuil de mouvement : on ne considère que c'est un drag qu'au-delà
      // de DRAG_THRESHOLD_PX. Sous ce seuil, c'est du micro-mouvement
      // involontaire du doigt — le nœud reste en place et `isDraggingRef`
      // reste à `false` pour que le `touchend` le traite comme un tap.
      const start = dragStartRef.current;
      if (start) {
        const dx = x - start.x;
        const dy = y - start.y;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      }

      const pos = renderer.viewportToGraph({ x, y });
      const sn = simNodesRef.current.get(draggedNodeRef.current);
      if (sn) {
        sn.fx = pos.x;
        sn.fy = pos.y;
      }
      isDraggingRef.current = true;
    };


    // -------------------------------------------------------------------
    // Pattern double-tap mobile (équivalent du hover desktop) :
    //  - 1er tap sur un nœud → highlight des liens directs (comme hover)
    //  - 2e tap sur le MÊME nœud sous DOUBLE_TAP_MS → ouvre la fiche
    //  - tap sur un AUTRE nœud → transfert du highlight (= 1er tap)
    //  - tap sur le fond / drag → pas un tap, ne déclenche rien
    // -------------------------------------------------------------------
    const DOUBLE_TAP_MS = 350;

    const onTouchEndNative = (e: TouchEvent) => {
      // Marquage timestamp AVANT tout — sert au filtrage du `clickNode`
      // synthétique (ghost click) émis par Sigma juste après ce touchend.
      lastTouchAtRef.current = Date.now();

      const wasDragging = isDraggingRef.current;
      const id = draggedNodeRef.current;
      stopDrag();

      // Drag réel ou doigt levé hors d'un nœud → on ne fait rien
      if (!id || wasDragging) return;


      e.preventDefault();
      const now = Date.now();
      const isDoubleTap =
        lastTapNodeRef.current === id &&
        now - lastTapTimeRef.current < DOUBLE_TAP_MS;

      if (isDoubleTap) {
        // 2e tap → ouvre la fiche, on reset l'état tap
        lastTapNodeRef.current = null;
        lastTapTimeRef.current = 0;
        navigate(`/character/${id}`);
      } else {
        // 1er tap (ou nouveau nœud) → highlight des liens directs.
        // On utilise la même variable `hoveredRef` que enterNode/leaveNode
        // côté desktop, donc le nodeReducer/edgeReducer fait déjà le rendu.
        hoveredRef.current = id;
        renderer.refresh();
        lastTapNodeRef.current = id;
        lastTapTimeRef.current = now;
      }
    };


    
    const opts = { passive: false, capture: true } as AddEventListenerOptions;
    el.addEventListener('touchstart', onTouchStartNative, opts);
    el.addEventListener('touchmove', onTouchMoveNative, opts);
    el.addEventListener('touchend', onTouchEndNative, opts);
    el.addEventListener('touchcancel', onTouchEndNative, opts);


  
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchcancel', stopDrag);

    return () => {
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
      window.removeEventListener('touchcancel', stopDrag);
      el.removeEventListener('touchstart', onTouchStartNative);
      el.removeEventListener('touchmove', onTouchMoveNative);
      el.removeEventListener('touchend', onTouchEndNative);
      el.removeEventListener('touchcancel', onTouchEndNative);
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
      style={{ cursor: 'default', touchAction: 'none' }}
    />
  );

}
