// =====================================================================
// Single data-access façade.
//
//  - When Supabase env vars are configured  → real backend.
//  - Otherwise                              → localStorage fallback
//                                              (no demo seed; empty start).
//
// All hooks (`useSpace`, `useCharacters`, `useRelations`, `useLocations`)
// import from this module, never from supabase.ts or mockDb.ts directly.
// =====================================================================
import type { Character, Location, Relation, Space } from '@/types';
import {
  getSupabase,
  isSupabaseConfigured,
  generateInviteCode,
  hashPassword,
  verifyPassword,
} from './supabase';
import { localDb } from './mockDb';
import { migrateRelationType } from './constants';

// ----- Public stable error codes (matched by the UI for translation) -----
export const ERR_WRONG_PASSWORD = 'WRONG_PASSWORD';
export const ERR_SPACE_NOT_FOUND = 'SPACE_NOT_FOUND';

// ----------------------------------------------------------------------
// Spaces
// ----------------------------------------------------------------------
async function createSpace(name: string, password: string): Promise<Space> {
  const sb = getSupabase();
  const invite_code = generateInviteCode();
  const password_hash = hashPassword(password);

  if (sb) {
    const { data, error } = await sb
      .from('spaces')
      .insert({ name, invite_code, password_hash })
      .select()
      .single();
    if (error) throw error;
    return data as Space;
  }
  return localDb.createSpace({ name, invite_code, password_hash });
}

async function joinSpace(inviteCode: string, password: string): Promise<Space> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('spaces')
      .select('*')
      .eq('invite_code', inviteCode)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(ERR_SPACE_NOT_FOUND);
    if (!verifyPassword(password, (data as Space).password_hash)) {
      throw new Error(ERR_WRONG_PASSWORD);
    }
    return data as Space;
  }
  const space = localDb.findSpaceByCode(inviteCode);
  if (!space) throw new Error(ERR_SPACE_NOT_FOUND);
  if (!verifyPassword(password, space.password_hash)) throw new Error(ERR_WRONG_PASSWORD);
  return space;
}

// ----------------------------------------------------------------------
// Locations
// ----------------------------------------------------------------------
async function getSpaceLocations(spaceId: string): Promise<Location[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('locations')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Location[];
  }
  return localDb.getSpaceLocations(spaceId);
}

async function createLocation(input: Omit<Location, 'id' | 'created_at'>): Promise<Location> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('locations').insert(input).select().single();
    if (error) throw error;
    return data as Location;
  }
  return localDb.createLocation(input);
}

async function updateLocation(id: string, updates: Partial<Pick<Location, 'name' | 'color'>>): Promise<Location> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('locations').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Location;
  }
  return localDb.updateLocation(id, updates);
}

async function deleteLocation(id: string): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('locations').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  return localDb.deleteLocation(id);
}

// ----------------------------------------------------------------------
// Characters
// ----------------------------------------------------------------------
function normaliseChar(c: Character): Character {
  return { ...c, traits: c.traits ?? [], tags: c.tags ?? [] };
}

async function getSpaceCharacters(spaceId: string): Promise<Character[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('characters')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((c) => normaliseChar(c as Character));
  }
  return localDb.getSpaceCharacters(spaceId).map(normaliseChar);
}

async function createCharacter(
  character: Omit<Character, 'id' | 'created_at' | 'updated_at'>,
): Promise<Character> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('characters').insert(character).select().single();
    if (error) throw error;
    return normaliseChar(data as Character);
  }
  return normaliseChar(localDb.createCharacter(character));
}

async function updateCharacter(id: string, updates: Partial<Character>): Promise<Character> {
  const sb = getSupabase();
  const patch = { ...updates, updated_at: new Date().toISOString() };
  if (sb) {
    const { data, error } = await sb.from('characters').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return normaliseChar(data as Character);
  }
  return normaliseChar(localDb.updateCharacter(id, patch));
}

async function deleteCharacter(id: string): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('characters').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  return localDb.deleteCharacter(id);
}

// ----------------------------------------------------------------------
// Relations
// ----------------------------------------------------------------------
function normaliseRel(r: Relation): Relation {
  return { ...r, relation_type: migrateRelationType(r.relation_type) };
}

async function getSpaceRelations(spaceId: string): Promise<Relation[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from('relations')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => normaliseRel(r as Relation));
  }
  return localDb.getSpaceRelations(spaceId).map(normaliseRel);
}

async function createRelation(rel: Omit<Relation, 'id' | 'created_at'>): Promise<Relation> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('relations').insert(rel).select().single();
    if (error) throw error;
    return normaliseRel(data as Relation);
  }
  return normaliseRel(localDb.createRelation(rel));
}

async function updateRelation(
  id: string,
  updates: Partial<Pick<Relation, 'relation_type' | 'relation_detail'>>,
): Promise<Relation> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('relations').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return normaliseRel(data as Relation);
  }
  return normaliseRel(localDb.updateRelation(id, updates));
}

async function deleteRelation(id: string): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('relations').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  return localDb.deleteRelation(id);
}

// ----------------------------------------------------------------------
// Realtime — subscribe to all space-scoped changes.
//
// Returns an unsubscribe function. Works with both backends:
//  - Supabase: opens a single channel for characters/relations/locations.
//  - localStorage: falls back to a 1 s polling loop.
// ----------------------------------------------------------------------
export function subscribeSpace(spaceId: string, onChange: () => void): () => void {
  const sb = getSupabase();
  if (sb) {
    const ch = sb
      .channel(`space-${spaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'characters', filter: `space_id=eq.${spaceId}` },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'relations', filter: `space_id=eq.${spaceId}` },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations', filter: `space_id=eq.${spaceId}` },
        onChange,
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }
  return localDb.subscribe(spaceId, onChange);
}

// ----------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------
export const db = {
  // Spaces
  createSpace,
  joinSpace,
  // Locations
  getSpaceLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  // Characters
  getSpaceCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  // Relations
  getSpaceRelations,
  createRelation,
  updateRelation,
  deleteRelation,
};

export { isSupabaseConfigured };
