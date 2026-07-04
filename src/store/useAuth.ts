import { create } from "zustand";
import type { User } from "@/lib/types";
import { api, setToken } from "@/lib/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  favoriteIds: Set<string>;
  init: () => Promise<void>;
  login: (account: string, password: string) => Promise<void>;
  loginSms: (phone: string, code: string) => Promise<void>;
  register: (body: { email?: string; phone?: string; username: string; password: string; code?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setFavorite: (id: string, fav: boolean) => void;
  refreshFavorites: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  favoriteIds: new Set(),

  init: async () => {
    try {
      const user = await api.me();
      set({ user });
      await get().refreshFavorites();
    } catch {
      setToken(null);
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },

  login: async (account, password) => {
    const { token, user } = await api.login(account, password);
    setToken(token);
    set({ user });
    await get().refreshFavorites();
  },

  loginSms: async (phone, code) => {
    const { token, user } = await api.loginSms(phone, code);
    setToken(token);
    set({ user });
    await get().refreshFavorites();
  },

  register: async (body) => {
    const { token, user } = await api.register(body);
    setToken(token);
    set({ user });
    await get().refreshFavorites();
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setToken(null);
    set({ user: null, favoriteIds: new Set() });
  },

  setFavorite: (id, fav) => {
    const next = new Set(get().favoriteIds);
    if (fav) next.add(id);
    else next.delete(id);
    set({ favoriteIds: next });
  },

  refreshFavorites: async () => {
    try {
      const ids = await api.favoriteIds();
      set({ favoriteIds: new Set(ids) });
    } catch {
      /* ignore */
    }
  },
}));
