// Helper pour les appels API vers Express

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

/**
 * Récupère le token depuis localStorage
 */
export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

/**
 * Effectue une requête authentifiée vers l'API
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erreur serveur" }));
    throw new Error(error.error || `Erreur ${response.status}`);
  }

  return response.json();
};

/**
 * Récupère les informations de l'utilisateur connecté
 */
export const getMe = async () => {
  return apiRequest("/api/me", { method: "GET" });
};

