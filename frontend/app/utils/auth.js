// Utilitaire pour gérer l'authentification côté client

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("auth_token");
  return !!token;
};

/**
 * Récupère le token d'authentification
 * @returns {string|null}
 */
export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

/**
 * Récupère les données de l'utilisateur
 * @returns {object|null}
 */
export const getUser = () => {
  if (typeof window === "undefined") return null;
  const userData = localStorage.getItem("user");
  return userData ? JSON.parse(userData) : null;
};

/**
 * Stocke les données d'authentification
 * @param {string} token - Token d'authentification
 * @param {object} user - Données de l'utilisateur
 */
export const setAuth = (token, user) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

/**
 * Supprime les données d'authentification
 */
export const clearAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
};

/**
 * Vérifie la validité du token avec le serveur
 * @returns {Promise<object|null>}
 */
export const verifyToken = async () => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      clearAuth();
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (err) {
    console.error("Erreur vérification token:", err);
    clearAuth();
    return null;
  }
};

/**
 * Effectue une requête authentifiée
 * @param {string} url - URL de l'API
 * @param {object} options - Options de la requête fetch
 * @returns {Promise<Response>}
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

