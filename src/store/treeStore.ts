import { create } from "zustand";
import { Person, Relation } from "@/types";

interface TreeStore {
  persons: Person[];
  relations: Relation[];
  selectedPersonId: string | null;
  isAdmin: boolean;
  dataLoaded: boolean;
  setPersons: (persons: Person[]) => void;
  setRelations: (relations: Relation[]) => void;
  addPerson: (person: Person) => void;
  updatePerson: (person: Person) => void;
  deletePerson: (id: string) => void;
  addRelation: (relation: Relation) => void;
  deleteRelation: (id: string) => void;
  setSelectedPerson: (id: string | null) => void;
  setIsAdmin: (v: boolean) => void;
  updatePersonPosition: (id: string, x: number, y: number) => void;
  setDataLoaded: (v: boolean) => void;
}

export const useTreeStore = create<TreeStore>((set) => ({
  persons: [],
  relations: [],
  selectedPersonId: null,
  isAdmin: false,
  dataLoaded: false,
  setPersons: (persons) => set({ persons }),
  setRelations: (relations) => set({ relations }),
  addPerson: (person) => set((s) => ({ persons: [...s.persons, person] })),
  updatePerson: (person) =>
    set((s) => ({ persons: s.persons.map((p) => (p.id === person.id ? person : p)) })),
  deletePerson: (id) =>
    set((s) => ({
      persons: s.persons.filter((p) => p.id !== id),
      relations: s.relations.filter((r) => r.fromPersonId !== id && r.toPersonId !== id),
    })),
  addRelation: (relation) => set((s) => ({ relations: [...s.relations, relation] })),
  deleteRelation: (id) =>
    set((s) => ({ relations: s.relations.filter((r) => r.id !== id) })),
  setSelectedPerson: (id) => set({ selectedPersonId: id }),
  setIsAdmin: (v) => set({ isAdmin: v }),
  updatePersonPosition: (id, x, y) =>
    set((s) => ({
      persons: s.persons.map((p) => (p.id === id ? { ...p, positionX: x, positionY: y } : p)),
    })),
  setDataLoaded: (v) => set({ dataLoaded: v }),
}));
