// =====================================================================
// Single data-access façade.
//
//  - When Supabase env vars are configured  → real backend.
//  - Otherwise                              → localStorage fallback
//                                              (no demo seed; empty start).
//
// All hooks (`useSpace`, `useCharacters`, `useRelations`, `useLocations`)
// import from this module, never from supabase.ts or mockDb.ts directly.
//
// SECURITY MODEL (Supabase backend)
// ---------------------------------------------------------------------
//   The tables are NOT directly accessible with the anon key anymore
//   (RLS denies everything). Every operation goes through a SECURITY
//   DEFINER RPC that requires a per-space session TOKEN, issued only
//   after the space password is verified server-side. See
//   `supabase-security-migration.sql`. The token lives in the Zustand
//   session and is read here at call time.
// =====================================================================
import type { Character, Location, Relation, Space, SpaceSession, Timeline } from '@/types';
import {
  getSupabase,
  isSupabaseConfigured,
  generateInviteCode,
  hashPassword,
  verifyPassword,
} from './supabase';
import { localDb } from './mockDb';
import { migrateRelationType } from './constants';
import { useAppStore } from '@/stores/appStore';

// ----- Public stable error codes (matched by the UI for translation) -----
export const ERR_WRONG_PASSWORD = 'WRONG_PASSWORD';
export const ERR_SPACE_NOT_FOUND = 'SPACE_NOT_FOUND';

// Current space token (from the persisted session). Empty when logged out.
function authToken(): string {
  return useAppStore.getState().session?.token ?? '';
}

// Map a Postgres/PostgREST error from an auth RPC to our stable codes.
function mapAuthError(message: string | undefined): Error {
  const m = message ?? '';
  if (m.includes('WRONG_PASSWORD')) return new Error(ERR_WRONG_PASSWORD);
  if (m.includes('SPACE_NOT_FOUND')) return new Error(ERR_SPACE_NOT_FOUND);
  return new Error(m || 'UNKNOWN_ERROR');
}

// A locally-minted token for the no-backend (localStorage) fallback.
function localToken(spaceId: string): string {
  return btoa(`${spaceId}:${Date.now()}`);
}

// ----------------------------------------------------------------------
// Spaces — return a full SpaceSession ({ space, token, isAdmin }) so the
// caller can open the session with a server-issued token.
// ----------------------------------------------------------------------
async function createSpace(name: string, password: string): Promise<SpaceSession> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('create_space', {
      p_name: name,
      p_password: password,
    });
    if (error) throw mapAuthError(error.message);
    return {
      space: data.space as Space,
      token: data.token as string,
      isAdmin: Boolean(data.is_admin),
    };
  }

  const invite_code = generateInviteCode();
  const password_hash = hashPassword(password);
  const space = localDb.createSpace({ name, invite_code, password_hash });
  return { space, token: localToken(space.id), isAdmin: true };
}

async function joinSpace(inviteCode: string, password: string): Promise<SpaceSession> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('join_space', {
      p_invite_code: inviteCode,
      p_password: password,
    });
    if (error) throw mapAuthError(error.message);
    return {
      space: data.space as Space,
      token: data.token as string,
      isAdmin: Boolean(data.is_admin),
    };
  }

  const space = localDb.findSpaceByCode(inviteCode);
  if (!space) throw new Error(ERR_SPACE_NOT_FOUND);
  if (!verifyPassword(password, space.password_hash ?? '')) throw new Error(ERR_WRONG_PASSWORD);
  return { space, token: localToken(space.id), isAdmin: false };
}

/**
 * Suppression complète d'un grimoire — cascade.
 *  - Côté Supabase : RPC `delete_space` qui re-vérifie le mot de passe
 *    côté serveur et supprime les tables enfants puis le space.
 *  - Côté localStorage : vérification locale puis suppression.
 * Throws ERR_WRONG_PASSWORD ou ERR_SPACE_NOT_FOUND.
 */
async function deleteSpace(spaceId: string, password: string): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.rpc('delete_space', {
      p_token: authToken(),
      p_password: password,
    });
    if (error) throw mapAuthError(error.message);
    return;
  }

  const allSpaces =
    JSON.parse(localStorage.getItem('inkstone_local_data') || '{}').spaces ?? [];
  const target = allSpaces.find((s: Space) => s.id === spaceId);
  if (!target) throw new Error(ERR_SPACE_NOT_FOUND);
  if (!verifyPassword(password, target.password_hash ?? '')) {
    throw new Error(ERR_WRONG_PASSWORD);
  }
  localDb.deleteSpace(spaceId);
}

// ----------------------------------------------------------------------
// Locations
// ----------------------------------------------------------------------
async function getSpaceLocations(spaceId: string): Promise<Location[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('get_locations', { p_token: authToken() });
    if (error) throw error;
    return (data ?? []) as Location[];
  }
  return localDb.getSpaceLocations(spaceId);
}

async function createLocation(input: Omit<Location, 'id' | 'created_at'>): Promise<Location> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('create_location', { p_token: authToken(), p_data: input });
    if (error) throw error;
    return data as Location;
  }
  return localDb.createLocation(input);
}

async function updateLocation(id: string, updates: Partial<Pick<Location, 'name' | 'color'>>): Promise<Location> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('update_location', {
      p_token: authToken(),
      p_id: id,
      p_data: updates,
    });
    if (error) throw error;
    return data as Location;
  }
  return localDb.updateLocation(id, updates);
}

async function deleteLocation(id: string): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.rpc('delete_location', { p_token: authToken(), p_id: id });
    if (error) throw error;
    return;
  }
  return localDb.deleteLocation(id);
}

// ----------------------------------------------------------------------
// Timeline (Chroniques) — une frise unique par space, stockée en un bloc.
// ----------------------------------------------------------------------
async function getTimeline(spaceId: string): Promise<Timeline | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('get_timeline', { p_token: authToken() });
    if (error) throw error;
    const rows = (data ?? []) as Timeline[];
    return rows[0] ?? null;
  }
  return localDb.getTimeline(spaceId);
}

async function saveTimeline(
  spaceId: string,
  patch: Pick<Timeline, 'start_year' | 'year_count' | 'entries'>,
): Promise<Timeline> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('save_timeline', {
      p_token: authToken(),
      p_data: {
        start_year: patch.start_year,
        year_count: patch.year_count,
        entries: patch.entries,
      },
    });
    if (error) throw error;
    return data as Timeline;
  }
  return localDb.saveTimeline(spaceId, {
    space_id: spaceId,
    start_year: patch.start_year,
    year_count: patch.year_count,
    entries: patch.entries,
    updated_at: new Date().toISOString(),
  });
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
    const { data, error } = await sb.rpc('get_characters', { p_token: authToken() });
    if (error) throw error;
    return ((data ?? []) as Character[]).map(normaliseChar);
  }
  return localDb.getSpaceCharacters(spaceId).map(normaliseChar);
}

async function createCharacter(
  character: Omit<Character, 'id' | 'created_at' | 'updated_at'>,
): Promise<Character> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('create_character', {
      p_token: authToken(),
      p_data: character,
    });
    if (error) throw error;
    return normaliseChar(data as Character);
  }
  return normaliseChar(localDb.createCharacter(character));
}

async function updateCharacter(id: string, updates: Partial<Character>): Promise<Character> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('update_character', {
      p_token: authToken(),
      p_id: id,
      p_data: updates,
    });
    if (error) throw error;
    return normaliseChar(data as Character);
  }
  const patch = { ...updates, updated_at: new Date().toISOString() };
  return normaliseChar(localDb.updateCharacter(id, patch));
}

async function deleteCharacter(id: string): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.rpc('delete_character', { p_token: authToken(), p_id: id });
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
    const { data, error } = await sb.rpc('get_relations', { p_token: authToken() });
    if (error) throw error;
    return ((data ?? []) as Relation[]).map(normaliseRel);
  }
  return localDb.getSpaceRelations(spaceId).map(normaliseRel);
}

async function createRelation(rel: Omit<Relation, 'id' | 'created_at'>): Promise<Relation> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.rpc('create_relation', { p_token: authToken(), p_data: rel });
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
    const { data, error } = await sb.rpc('update_relation', {
      p_token: authToken(),
      p_id: id,
      p_data: updates,
    });
    if (error) throw error;
    return normaliseRel(data as Relation);
  }
  return normaliseRel(localDb.updateRelation(id, updates));
}

async function deleteRelation(id: string): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.rpc('delete_relation', { p_token: authToken(), p_id: id });
    if (error) throw error;
    return;
  }
  return localDb.deleteRelation(id);
}

// ----------------------------------------------------------------------
// Realtime — subscribe to all space-scoped changes.
//
// Returns an unsubscribe function. Works with both backends:
//  - Supabase: a SINGLE broadcast channel per space is shared between
//              hooks. The DB broadcasts a content-free "change" ping on
//              `space-{id}` after any insert/update/delete (see the
//              migration's triggers); each ping triggers a refetch.
//              postgres_changes can no longer be used because RLS now
//              denies the anon role SELECT access.
//  - localStorage: falls back to a 1 s polling loop.
// ----------------------------------------------------------------------
type SbChannelEntry = {
  ch: unknown;
  listeners: Set<() => void>;
};
const _channelsBySpace: Map<string, SbChannelEntry> = new Map();

export function subscribeSpace(spaceId: string, onChange: () => void): () => void {
  const sb = getSupabase();
  if (sb) {
    let entry = _channelsBySpace.get(spaceId);

    if (!entry) {
      const listeners = new Set<() => void>();
      const fanout = () => listeners.forEach((fn) => fn());

      const ch = sb
        .channel(`space-${spaceId}`)
        .on('broadcast', { event: 'change' }, fanout)
        .subscribe();

      entry = { ch, listeners };
      _channelsBySpace.set(spaceId, entry);
    }

    entry.listeners.add(onChange);

    return () => {
      const e = _channelsBySpace.get(spaceId);
      if (!e) return;
      e.listeners.delete(onChange);
      if (e.listeners.size === 0) {
        sb.removeChannel(e.ch as Parameters<typeof sb.removeChannel>[0]);
        _channelsBySpace.delete(spaceId);
      }
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
  deleteSpace,

  // Locations
  getSpaceLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  // Timeline (Chroniques)
  getTimeline,
  saveTimeline,
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
