import { useCallback, useEffect } from 'react';
import { db, subscribeSpace } from '@/lib/db';
import { useAppStore } from '@/stores/appStore';
import type { Relation } from '@/types';

export function useRelations(spaceId: string | undefined) {
  const {
    relations,
    setRelations,
    addRelation,
    updateRelation: updateRelInStore,
    removeRelation: removeRelFromStore,
  } = useAppStore();

  const fetchRelations = useCallback(async () => {
    if (!spaceId) return;
    const rels = await db.getSpaceRelations(spaceId);
    setRelations(rels);
  }, [spaceId, setRelations]);

  const createRelation = useCallback(
    async (relation: Omit<Relation, 'id' | 'created_at'>) => {
      const newRel = await db.createRelation(relation);
      addRelation(newRel);
      return newRel;
    },
    [addRelation],
  );

  const updateRelation = useCallback(
    async (id: string, updates: Partial<Pick<Relation, 'relation_type' | 'relation_detail'>>) => {
      const updated = await db.updateRelation(id, updates);
      updateRelInStore(updated);
      return updated;
    },
    [updateRelInStore],
  );

  const deleteRelation = useCallback(
    async (id: string) => {
      await db.deleteRelation(id);
      removeRelFromStore(id);
    },
    [removeRelFromStore],
  );

  useEffect(() => {
    if (!spaceId) return;
    fetchRelations();
    const unsub = subscribeSpace(spaceId, fetchRelations);
    return unsub;
  }, [spaceId, fetchRelations]);

  return { relations, fetchRelations, createRelation, updateRelation, deleteRelation };
}
