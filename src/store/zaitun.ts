import { create } from "zustand";

export type Person = {
  id: string;
  treeId: string;
  firstName: string;
  lastName: string | null;
  gender: string | null;
  birthDate: string | null;
  deathDate: string | null;
  photo: string | null;
  bio: string | null;
  occupation: string | null;
  isDeceased: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RelType =
  | "father" | "mother" | "spouse" | "son" | "daughter" | "child"
  | "brother" | "sister" | "sibling" | "grandfather" | "grandmother"
  | "grandson" | "granddaughter" | "uncle" | "aunt" | "cousin" | "other";

export type Relationship = {
  id: string;
  treeId: string;
  person1Id: string;
  person2Id: string;
  type: RelType;
  createdAt: string;
};

export type FamilyTreeData = {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string; email: string } | null;
  persons?: Person[];
  members?: { id: string; userId: string; role: string; treeId: string }[];
};

export type DiaryEntry = {
  id: string;
  treeId: string;
  personId: string;
  date: string;
  title: string;
  content: string;
  privacy: "private" | "family" | "public";
  tags: string;
  createdAt: string;
  updatedAt: string;
  person?: { firstName: string; lastName: string | null; gender: string | null };
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type View = "hero" | "trees" | "tree-detail" | "diary" | "join" | "admin";

interface ZaitunStore {
  // View
  view: View;
  setView: (v: View) => void;

  // Locale
  locale: "en" | "bn";
  setLocale: (l: "en" | "bn") => void;

  // Trees
  trees: FamilyTreeData[];
  setTrees: (t: FamilyTreeData[]) => void;

  // Active tree
  activeTreeId: string | null;
  setActiveTreeId: (id: string | null) => void;

  // Persons & relationships for active tree
  persons: Person[];
  relationships: Relationship[];
  setTreeData: (persons: Person[], relationships: Relationship[]) => void;
  addPersonLocally: (p: Person) => void;
  updatePersonLocally: (p: Person) => void;
  removePersonLocally: (id: string) => void;

  // Person form
  editingPerson: Person | null;
  setEditingPerson: (p: Person | null) => void;

  // Diary
  diaryEntries: DiaryEntry[];
  setDiaryEntries: (entries: DiaryEntry[]) => void;
  addDiaryEntryLocally: (entry: DiaryEntry) => void;
  updateDiaryEntryLocally: (entry: DiaryEntry) => void;
  removeDiaryEntryLocally: (id: string) => void;
  editingDiaryEntry: DiaryEntry | null;
  setEditingDiaryEntry: (entry: DiaryEntry | null) => void;
  diaryFilterPersonId: string | null;
  setDiaryFilterPersonId: (id: string | null) => void;

  // Auth
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  showAuthDialog: boolean;
  setShowAuthDialog: (v: boolean) => void;
  authMode: "login" | "signup";
  setAuthMode: (m: "login" | "signup") => void;
}

export const useZaitunStore = create<ZaitunStore>((set) => ({
  view: "hero",
  setView: (v) => set({ view: v }),
  locale: "en",
  setLocale: (l) => set({ locale: l }),
  trees: [],
  setTrees: (t) => set({ trees: t }),
  activeTreeId: null,
  setActiveTreeId: (id) => set({ activeTreeId: id }),
  persons: [],
  relationships: [],
  setTreeData: (persons, relationships) => set({ persons, relationships }),
  addPersonLocally: (p) => set((s) => ({ persons: [...s.persons, p] })),
  updatePersonLocally: (p) =>
    set((s) => ({ persons: s.persons.map((x) => (x.id === p.id ? p : x)) })),
  removePersonLocally: (id) =>
    set((s) => ({
      persons: s.persons.filter((x) => x.id !== id),
      relationships: s.relationships.filter((x) => x.person1Id !== id && x.person2Id !== id),
    })),
  editingPerson: null,
  setEditingPerson: (p) => set({ editingPerson: p }),
  // Diary
  diaryEntries: [],
  setDiaryEntries: (entries) => set({ diaryEntries: entries }),
  addDiaryEntryLocally: (entry) =>
    set((s) => ({ diaryEntries: [entry, ...s.diaryEntries] })),
  updateDiaryEntryLocally: (entry) =>
    set((s) => ({ diaryEntries: s.diaryEntries.map((x) => (x.id === entry.id ? entry : x)) })),
  removeDiaryEntryLocally: (id) =>
    set((s) => ({ diaryEntries: s.diaryEntries.filter((x) => x.id !== id) })),
  editingDiaryEntry: null,
  setEditingDiaryEntry: (entry) => set({ editingDiaryEntry: entry }),
  diaryFilterPersonId: null,
  setDiaryFilterPersonId: (id) => set({ diaryFilterPersonId: id }),
  // Auth
  user: null,
  setUser: (u) => set({ user: u }),
  showAuthDialog: false,
  setShowAuthDialog: (v) => set({ showAuthDialog: v }),
  authMode: "login",
  setAuthMode: (m) => set({ authMode: m }),
}));