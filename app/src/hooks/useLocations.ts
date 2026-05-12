import { useCallback, useEffect } from 'react';
import { db, subscribeSpace } from '@/lib/db';
import { useAppStore } from '@/stores/appStore';
import type { Location } from '@/types';

/**
 * Hook qui charge et expose les `Location` du space courant + opérations CRUD.
 * Souscrit aux changements (poll 1 s) pour rester en phase si plusieurs onglets.
 */
export function useLocations(spaceId: string | undefined) {
  const {
    locations,
    setLocations,
    addLocation,
    updateLocation: updateLocationInStore,
    removeLocation,
  } = useAppStore();

  const fetchLocations = useCallback(async () => {
    if (!spaceId) return;
    const list = await db.getSpaceLocations(spaceId);
    setLocations(list);
  }, [spaceId, setLocations]);

  const createLocation = useCallback(
    async (input: { name: string; color: string }) => {
      if (!spaceId) throw new Error('No space');
      const loc = await db.createLocation({
        space_id: spaceId,
        name: input.name,
        color: input.color,
      });
      addLocation(loc);
      return loc;
    },
    [spaceId, addLocation]
  );

  const updateLocation = useCallback(
    async (id: string, updates: Partial<Pick<Location, 'name' | 'color'>>) => {
      const updated = await db.updateLocation(id, updates);
      updateLocationInStore(updated);
      return updated;
    },
    [updateLocationInStore]
  );

  const deleteLocation = useCallback(
    async (id: string) => {
      await db.deleteLocation(id);
      removeLocation(id);
    },
    [removeLocation]
  );

  useEffect(() => {
    if (!spaceId) return;
    fetchLocations();
    const unsub = subscribeSpace(spaceId, fetchLocations);
    return unsub;
  }, [spaceId, fetchLocations]);

  return { locations, fetchLocations, createLocation, updateLocation, deleteLocation };
}
