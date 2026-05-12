// =====================================================================
// localStorage fallback used when Supabase env vars are NOT configured.
// No demo seed: the app starts empty, exactly like the production backend.
// Synchronous CRUD; consumed exclusively by `lib/db.ts`.
// =====================================================================
import type { Space, Character, Relation, Location } from '@/types';

const STORAGE_KEY = 'inkstone_local_data';

interface MockData {
  spaces: Space[];
  characters: Character[];
  relations: Relation[];
  locations: Location[];
}

function emptyData(): MockData {
  return { spaces: [], characters: [], relations: [], locations: [] };
}

function getData(): MockData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    return {
      spaces: parsed.spaces ?? [],
      characters: parsed.characters ?? [],
      relations: parsed.relations ?? [],
      locations: parsed.locations ?? [],
    };
  } catch {
    return emptyData();
  }
}

function saveData(d: MockData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const now = () => new Date().toISOString();

// ----------------------------------------------------------------------
// Public sync API used by `lib/db.ts`
// ----------------------------------------------------------------------
export const localDb = {
  // ----- Spaces -----
  createSpace(input: Omit<Space, 'id' | 'created_at' | 'updated_at'>): Space {
    const data = getData();
    const space: Space = {
      ...input,
      id: uid('space'),
      created_at: now(),
      updated_at: now(),
    };
    data.spaces.push(space);
    saveData(data);
    return space;
  },

  findSpaceByCode(code: string): Space | null {
    return getData().spaces.find((s) => s.invite_code === code) ?? null;
  },

  /** Suppression cascade : relations → characters → locations → space. */
  deleteSpace(spaceId: string): void {
    const data = getData();
    data.relations  = data.relations.filter((r) => r.space_id !== spaceId);
    data.characters = data.characters.filter((c) => c.space_id !== spaceId);
    data.locations  = data.locations.filter((l) => l.space_id !== spaceId);
    data.spaces     = data.spaces.filter((s) => s.id !== spaceId);
    saveData(data);
  },


  // ----- Locations -----
  getSpaceLocations(spaceId: string): Location[] {
    return getData().locations.filter((l) => l.space_id === spaceId);
  },

  createLocation(input: Omit<Location, 'id' | 'created_at'>): Location {
    const data = getData();
    const loc: Location = { ...input, id: uid('loc'), created_at: now() };
    data.locations.push(loc);
    saveData(data);
    return loc;
  },

  updateLocation(id: string, updates: Partial<Pick<Location, 'name' | 'color'>>): Location {
    const data = getData();
    const i = data.locations.findIndex((l) => l.id === id);
    if (i === -1) throw new Error('Location not found');
    data.locations[i] = { ...data.locations[i], ...updates };
    saveData(data);
    return data.locations[i];
  },

  deleteLocation(id: string): void {
    const data = getData();
    data.locations = data.locations.filter((l) => l.id !== id);
    data.characters.forEach((c) => {
      if (c.location === id) c.location = undefined;
    });
    saveData(data);
  },

  // ----- Characters -----
  getSpaceCharacters(spaceId: string): Character[] {
    return getData().characters.filter((c) => c.space_id === spaceId);
  },

  createCharacter(input: Omit<Character, 'id' | 'created_at' | 'updated_at'>): Character {
    const data = getData();
    const c: Character = { ...input, id: uid('char'), created_at: now(), updated_at: now() };
    data.characters.push(c);
    saveData(data);
    return c;
  },

  updateCharacter(id: string, updates: Partial<Character>): Character {
    const data = getData();
    const i = data.characters.findIndex((c) => c.id === id);
    if (i === -1) throw new Error('Character not found');
    data.characters[i] = { ...data.characters[i], ...updates, updated_at: now() };
    saveData(data);
    return data.characters[i];
  },

  deleteCharacter(id: string): void {
    const data = getData();
    data.characters = data.characters.filter((c) => c.id !== id);
    data.relations = data.relations.filter(
      (r) => r.from_character_id !== id && r.to_character_id !== id,
    );
    saveData(data);
  },

  // ----- Relations -----
  getSpaceRelations(spaceId: string): Relation[] {
    return getData().relations.filter((r) => r.space_id === spaceId);
  },

  createRelation(input: Omit<Relation, 'id' | 'created_at'>): Relation {
    const data = getData();
    const r: Relation = { ...input, id: uid('rel'), created_at: now() };
    data.relations.push(r);
    saveData(data);
    return r;
  },

  updateRelation(
    id: string,
    updates: Partial<Pick<Relation, 'relation_type' | 'relation_detail'>>,
  ): Relation {
    const data = getData();
    const i = data.relations.findIndex((r) => r.id === id);
    if (i === -1) throw new Error('Relation not found');
    data.relations[i] = { ...data.relations[i], ...updates };
    saveData(data);
    return data.relations[i];
  },

  deleteRelation(id: string): void {
    const data = getData();
    data.relations = data.relations.filter((r) => r.id !== id);
    saveData(data);
  },

  // ----- Realtime fallback (cross-tab polling) -----
  subscribe(spaceId: string, cb: () => void): () => void {
    let last = '';
    const tick = () => {
      const d = getData();
      const snap =
        JSON.stringify(d.characters.filter((c) => c.space_id === spaceId)) +
        JSON.stringify(d.relations.filter((r) => r.space_id === spaceId)) +
        JSON.stringify(d.locations.filter((l) => l.space_id === spaceId));
      if (last && last !== snap) cb();
      last = snap;
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  },
};
