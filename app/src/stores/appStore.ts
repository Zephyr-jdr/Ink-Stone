import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Character, Location, Relation, SpaceSession } from '@/types';

interface AppState {
  // Space session
  session: SpaceSession | null;
  setSession: (session: SpaceSession | null) => void;
  clearSession: () => void;

  // Characters
  characters: Character[];
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (character: Character) => void;
  removeCharacter: (id: string) => void;

  // Relations
  relations: Relation[];
  setRelations: (relations: Relation[]) => void;
  addRelation: (relation: Relation) => void;
  updateRelation: (relation: Relation) => void;
  removeRelation: (id: string) => void;

  // Locations (lieux personnalisables)
  locations: Location[];
  setLocations: (locations: Location[]) => void;
  addLocation: (location: Location) => void;
  updateLocation: (location: Location) => void;
  removeLocation: (id: string) => void;

  // UI - filtres
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: 'tous' | 'PJ' | 'PNJ';
  setFilterType: (type: 'tous' | 'PJ' | 'PNJ') => void;
  /**
   * 'tous' = pas de filtrage, sinon ID d'une Location.
   * 'sans-lieu' = uniquement les personnages sans `location`.
   */
  filterLocationId: string;
  setFilterLocationId: (id: string) => void;
  isGraphView: boolean;
  setIsGraphView: (value: boolean) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Toast
  toast: { message: string; visible: boolean } | null;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Session
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null, characters: [], relations: [], locations: [] }),

      // Characters
      characters: [],
      setCharacters: (characters) => set({ characters }),
      addCharacter: (character) =>
        set((state) => ({ characters: [...state.characters, character] })),
      updateCharacter: (character) =>
        set((state) => ({
          characters: state.characters.map((c) => (c.id === character.id ? character : c)),
        })),
      removeCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
          relations: state.relations.filter(
            (r) => r.from_character_id !== id && r.to_character_id !== id
          ),
        })),

      // Relations
      relations: [],
      setRelations: (relations) => set({ relations }),
      addRelation: (relation) =>
        set((state) => ({ relations: [...state.relations, relation] })),
      updateRelation: (relation) =>
        set((state) => ({
          relations: state.relations.map((r) => (r.id === relation.id ? relation : r)),
        })),
      removeRelation: (id) =>
        set((state) => ({ relations: state.relations.filter((r) => r.id !== id) })),

      // Locations
      locations: [],
      setLocations: (locations) => set({ locations }),
      addLocation: (location) =>
        set((state) => ({ locations: [...state.locations, location] })),
      updateLocation: (location) =>
        set((state) => ({
          locations: state.locations.map((l) => (l.id === location.id ? location : l)),
        })),
      removeLocation: (id) =>
        set((state) => ({
          locations: state.locations.filter((l) => l.id !== id),
          // Reset le `location` des personnages locaux qui pointaient vers ce lieu
          characters: state.characters.map((c) =>
            c.location === id ? { ...c, location: undefined } : c
          ),
        })),

      // UI
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      filterType: 'tous',
      setFilterType: (type) => set({ filterType: type }),
      filterLocationId: 'tous',
      setFilterLocationId: (id) => set({ filterLocationId: id }),
      isGraphView: false,
      setIsGraphView: (value) => set({ isGraphView: value }),

      // Loading
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Toast
      toast: null,
      showToast: (message) => {
        set({ toast: { message, visible: true } });
        setTimeout(() => set({ toast: null }), 2500);
      },
      hideToast: () => set({ toast: null }),
    }),
    {
      name: 'inkstone-storage',
      partialize: (state) => ({ session: state.session }),
    }
  )
);
