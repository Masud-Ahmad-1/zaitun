'use client'

import { create } from 'zustand'
import type { Locale, TranslationKey } from './i18n'

export type AppView = 'landing' | 'login' | 'register' | 'dashboard' | 'tree-editor'

export interface UserData {
  id: string
  email: string
  name: string
  locale: Locale
}

export interface TreeData {
  id: string
  name: string
  nameBn: string | null
  isPrivate: boolean
  shareToken: string | null
  ownerId: string
  createdAt: string
  _count?: { persons: number }
}

export interface PersonData {
  id: string
  name: string
  nameBn: string | null
  gender: string
  birthDate: string | null
  deathDate: string | null
  bio: string | null
  treeId: string
}

export interface RelationData {
  id: string
  fromId: string
  toId: string
  type: string
  treeId: string
}

interface AppState {
  view: AppView
  locale: Locale
  user: UserData | null
  currentTree: TreeData | null
  trees: TreeData[]
  persons: PersonData[]
  relationships: RelationData[]
  loading: boolean
  
  setView: (view: AppView) => void
  setLocale: (locale: Locale) => void
  setUser: (user: UserData | null) => void
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, name: string, password: string) => Promise<boolean>
  logout: () => void
  fetchTrees: () => Promise<void>
  createTree: (name: string, nameBn: string, isPrivate: boolean) => Promise<TreeData | null>
  deleteTree: (id: string) => Promise<boolean>
  setCurrentTree: (tree: TreeData) => void
  fetchTreeData: (treeId: string) => Promise<void>
  addPerson: (person: Omit<PersonData, 'id' | 'treeId' | 'createdAt' | 'updatedAt'>) => Promise<PersonData | null>
  updatePerson: (id: string, data: Partial<PersonData>) => Promise<boolean>
  deletePerson: (id: string) => Promise<boolean>
  addRelationship: (fromId: string, toId: string, type: string) => Promise<boolean>
  deleteRelationship: (id: string) => Promise<boolean>
  tr: (key: TranslationKey) => string
}

import { t as translate } from './i18n'

export const useAppStore = create<AppState>((set, get) => ({
  view: 'landing',
  locale: 'en',
  user: null,
  currentTree: null,
  trees: [],
  persons: [],
  relationships: [],
  loading: false,

  setView: (view) => set({ view }),
  setLocale: (locale) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
    set({ locale })
  },
  setUser: (user) => set({ user }),

  tr: (key) => translate(get().locale, key),

  login: async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) return false
      const user = await res.json()
      document.cookie = `zaitun_uid=${user.id}; path=/; max-age=${60 * 60 * 24 * 30}`
      set({ user, locale: user.locale || 'en' })
      return true
    } catch { return false }
  },

  register: async (email, name, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, locale: get().locale }),
      })
      if (!res.ok) return false
      const user = await res.json()
      document.cookie = `zaitun_uid=${user.id}; path=/; max-age=${60 * 60 * 24 * 30}`
      set({ user, locale: user.locale || 'en' })
      return true
    } catch { return false }
  },

  logout: () => {
    document.cookie = 'zaitun_uid=; path=/; max-age=0'
    set({ user: null, currentTree: null, trees: [], persons: [], relationships: [], view: 'landing' })
  },

  fetchTrees: async () => {
 const user = get().user
    if (!user) return
    set({ loading: true })
    try {
      const res = await fetch(`/api/trees?userId=${user.id}`)
      if (res.ok) {
        const trees = await res.json()
        set({ trees })
      }
    } catch { /* ignore */ }
    set({ loading: false })
  },

  createTree: async (name, nameBn, isPrivate) => {
    const user = get().user
    if (!user) return null
    try {
      const res = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nameBn, isPrivate, ownerId: user.id }),
      })
      if (!res.ok) return null
      const tree = await res.json()
      set((s) => ({ trees: [tree, ...s.trees] }))
      return tree
    } catch { return null }
  },

  deleteTree: async (id) => {
    try {
      const res = await fetch(`/api/trees/${id}`, { method: 'DELETE' })
      if (res.ok) {
        set((s) => ({ trees: s.trees.filter((t) => t.id !== id) }))
        return true
      }
    } catch { /* ignore */ }
    return false
  },

  setCurrentTree: (tree) => set({ currentTree: tree, view: 'tree-editor' }),

  fetchTreeData: async (treeId) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/trees/${treeId}`)
      if (res.ok) {
        const data = await res.json()
        set({ persons: data.persons || [], relationships: data.relationships || [] })
      }
    } catch { /* ignore */ }
    set({ loading: false })
  },

  addPerson: async (person) => {
    const treeId = get().currentTree?.id
    if (!treeId) return null
    try {
      const res = await fetch(`/api/trees/${treeId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...person, treeId }),
      })
      if (!res.ok) return null
      const p = await res.json()
      set((s) => ({ persons: [...s.persons, p] }))
      return p
    } catch { return null }
  },

  updatePerson: async (id, data) => {
    try {
      const res = await fetch(`/api/persons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        set((s) => ({
          persons: s.persons.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }))
        return true
      }
    } catch { /* ignore */ }
    return false
  },

  deletePerson: async (id) => {
    try {
      const res = await fetch(`/api/persons/${id}`, { method: 'DELETE' })
      if (res.ok) {
        set((s) => ({
          persons: s.persons.filter((p) => p.id !== id),
          relationships: s.relationships.filter((r) => r.fromId !== id && r.toId !== id),
        }))
        return true
      }
    } catch { /* ignore */ }
    return false
  },

  addRelationship: async (fromId, toId, type) => {
    const treeId = get().currentTree?.id
    if (!treeId) return false
    try {
      const res = await fetch(`/api/trees/${treeId}/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId, toId, type, treeId }),
      })
      if (res.ok) {
        const rel = await res.json()
        set((s) => ({ relationships: [...s.relationships, rel] }))
        return true
      }
    } catch { /* ignore */ }
    return false
  },

  deleteRelationship: async (id) => {
    const treeId = get().currentTree?.id
    if (!treeId) return false
    try {
      const res = await fetch(`/api/trees/${treeId}/relationships`, { method: 'DELETE' })
      if (res.ok) {
        set((s) => ({ relationships: s.relationships.filter((r) => r.id !== id) }))
        return true
      }
    } catch { /* ignore */ }
    return false
  },
}))
