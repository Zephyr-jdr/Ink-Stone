import { useCallback } from 'react';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/appStore';
import type { Space } from '@/types';

export function useSpace() {
  const { setSession } = useAppStore();

  // Creates a space WITHOUT setting the session yet — caller decides when to enter.
  const createSpace = useCallback(
    async (name: string, password: string) => {
      const space = await db.createSpace(name, password);
      return space;
    },
    [],
  );

  // Enter a space (set the session). Use after createSpace once user acknowledges the login code.
  const enterSpace = useCallback(
    (space: Space, isAdmin: boolean) => {
      const token = btoa(`${space.id}:${Date.now()}`);
      setSession({ space, isAdmin, token });
    },
    [setSession],
  );

  const joinSpace = useCallback(
    async (inviteCode: string, password: string) => {
      const space = await db.joinSpace(inviteCode, password);
      const token = btoa(`${space.id}:${Date.now()}`);
      setSession({ space, isAdmin: false, token });
      return space;
    },
    [setSession],
  );

  // Supprime un grimoire (cascade) après vérification du mot de passe.
  // Le caller est responsable de clear la session/router après succès.
  const deleteSpace = useCallback(
    async (spaceId: string, password: string) => {
      await db.deleteSpace(spaceId, password);
    },
    [],
  );

  return { createSpace, enterSpace, joinSpace, deleteSpace };
}

