"use client";

const API_URL ="https://projet-bdd-8nz1.onrender.com";
"https://projet-bdd-8nz1.onrender.com"
"http://localhost:4001"

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erreur serveur" }));
    throw new Error(error.error || `Erreur ${response.status}`);
  }

  return response.json();
};

export { API_URL };

