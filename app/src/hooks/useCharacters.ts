import { useCallback, useEffect } from 'react';
import { db, subscribeSpace } from '@/lib/db';
import { useAppStore } from '@/stores/appStore';
import type { Character } from '@/types';

export function useCharacters(spaceId: string | undefined) {
  const {
    characters,
    setCharacters,
    addCharacter,
    updateCharacter: updateCharInStore,
    removeCharacter: removeCharFromStore,
  } = useAppStore();

  const fetchCharacters = useCallback(async () => {
    if (!spaceId) return;
    const chars = await db.getSpaceCharacters(spaceId);
    setCharacters(chars);
  }, [spaceId, setCharacters]);

  const createCharacter = useCallback(
    async (character: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => {
      const newChar = await db.createCharacter(character);
      addCharacter(newChar);
      return newChar;
    },
    [addCharacter],
  );

  const updateCharacter = useCallback(
    async (id: string, updates: Partial<Character>) => {
      const updated = await db.updateCharacter(id, updates);
      updateCharInStore(updated);
      return updated;
    },
    [updateCharInStore],
  );

  const deleteCharacter = useCallback(
    async (id: string) => {
      await db.deleteCharacter(id);
      removeCharFromStore(id);
    },
    [removeCharFromStore],
  );

  useEffect(() => {
    if (!spaceId) return;
    fetchCharacters();
    const unsub = subscribeSpace(spaceId, fetchCharacters);
    return unsub;
  }, [spaceId, fetchCharacters]);

  return { characters, fetchCharacters, createCharacter, updateCharacter, deleteCharacter };
}
