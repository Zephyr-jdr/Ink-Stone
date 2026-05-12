import { useCallback } from 'react';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/appStore';

export function useSpace() {
  const { setSession } = useAppStore();

  const createSpace = useCallback(
    async (name: string, password: string) => {
      const space = await db.createSpace(name, password);
      const token = btoa(`${space.id}:${Date.now()}`);
      setSession({ space, isAdmin: true, token });
      return space;
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

  return { createSpace, joinSpace };
}
