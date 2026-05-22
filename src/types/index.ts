export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  photoUrl?: string;
  bio?: string;
  positionX: number;
  positionY: number;
  createdAt?: string;
}

export interface Relation {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  relationType: "parent" | "spouse" | "successor";
  successionType?: "chef_famille" | "heritier" | "representant" | "autre";
  marriageOrder?: number;
  marriageDate?: string;
  // Pour filiation : l'autre parent de l'enfant (ex: père X + mère Y → enfant Z)
  coParentId?: string;
}

export interface TreeData {
  persons: Person[];
  relations: Relation[];
}

export type RelationType = "parent" | "spouse" | "successor";
export type SuccessionType = "chef_famille" | "heritier" | "representant" | "autre";
