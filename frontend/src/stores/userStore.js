// Store utilisateur avec Zustand

import { create } from 'zustand';
import { getMe } from '../lib/api';

// Initialiser depuis localStorage si disponible
const getInitialUser = () => {
  if (typeof window === "undefined") return null;
  const userMeta = localStorage.getItem("userMeta");
  if (userMeta) {
    try {
      const meta = JSON.parse(userMeta);
      return {
        id: meta.id || null,
        role: meta.role || null,
        dept_id: meta.dept_id || null,
        formation_id: meta.formation_id || null
      };
    } catch (e) {
      return null;
    }
  }
  return null;
};

const initialUser = getInitialUser();

export const useUserStore = create((set) => ({
  user: initialUser,
  loading: !initialUser, // Si on a déjà un user, on n'est pas en chargement
  error: null,

  // Charger les données utilisateur
  fetchUser: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getMe();
      set({ user: data, loading: false });
      // Mettre à jour localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("userMeta", JSON.stringify(data));
      }
      return data;
    } catch (error) {
      console.error('Erreur chargement user:', error);
      set({ error: error.message, loading: false, user: null });
      throw error;
    }
  },

  // Définir l'utilisateur manuellement
  setUser: (user) => set({ user, loading: false, error: null }),

  // Réinitialiser le store
  reset: () => set({ user: null, loading: true, error: null }),

  // Vérifier si l'utilisateur a un rôle spécifique
  hasRole: (role) => {
    const state = useUserStore.getState();
    return state.user?.role === role;
  },

  // Vérifier si l'utilisateur a un des rôles
  hasAnyRole: (roles) => {
    const state = useUserStore.getState();
    return roles.includes(state.user?.role);
  }
}));

