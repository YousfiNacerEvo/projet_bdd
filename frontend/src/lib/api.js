// Helper pour les appels API vers Express

const API_URL ="https://projet-bdd-8nz1.onrender.com"
"https://projet-bdd-8nz1.onrender.com"
"http://localhost:4001" 

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

  if (response.status === 401 || response.status === 403) {
    throw new Error("Unauthorized");
  }

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

// ------- Admin helpers -------
export const adminApi = {
  listSalles: () => apiRequest("/api/admin/salles", { method: "GET" }),
  createSalle: (payload) => apiRequest("/api/admin/salles", { method: "POST", body: JSON.stringify(payload) }),
  updateSalle: (id, payload) =>
    apiRequest(`/api/admin/salles/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteSalle: (id) => apiRequest(`/api/admin/salles/${id}`, { method: "DELETE" }),

  listCreneaux: () => apiRequest("/api/admin/creneaux", { method: "GET" }),
  createCreneau: (payload) => apiRequest("/api/admin/creneaux", { method: "POST", body: JSON.stringify(payload) }),
  updateCreneau: (id, payload) =>
    apiRequest(`/api/admin/creneaux/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteCreneau: (id) => apiRequest(`/api/admin/creneaux/${id}`, { method: "DELETE" }),

  runPlanning: (payload) =>
    apiRequest("/api/admin/planning/run", { method: "POST", body: JSON.stringify(payload) }),
  listRuns: () => apiRequest("/api/admin/planning/runs", { method: "GET" }),
  getRun: (id) => apiRequest(`/api/admin/planning/run/${id}`, { method: "GET" }),
  getRunItems: (id) => apiRequest(`/api/admin/planning/run/${id}/items`, { method: "GET" }),
  getRunConflicts: (id) => apiRequest(`/api/admin/planning/run/${id}/conflicts`, { method: "GET" }),
  submitRun: (id) => apiRequest(`/api/admin/planning/run/${id}/submit`, { method: "POST" }),
  publishRun: (id) => apiRequest(`/api/admin/planning/run/${id}/publish`, { method: "POST" }),

  listFormations: () => apiRequest("/api/admin/formations", { method: "GET" })
};

export const kpiApi = {
  get: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.run_id) qs.set("run_id", params.run_id);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiRequest(`/api/kpis${suffix}`, { method: "GET" });
  }
};

export const doyenApi = {
  listRuns: (status) => {
    const qs = status ? `?status=${status}` : "";
    return apiRequest(`/api/doyen/planning/runs${qs}`, { method: "GET" });
  },
  getRun: (id) => apiRequest(`/api/doyen/planning/run/${id}`, { method: "GET" }),
  getRunItems: (id) => apiRequest(`/api/doyen/planning/run/${id}/items`, { method: "GET" }),
  approve: (id) => apiRequest(`/api/doyen/planning/run/${id}/approve`, { method: "POST" }),
  reject: (id, reason) =>
    apiRequest(`/api/doyen/planning/run/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason })
    })
};

export const planningApi = {
  getPublished: () => apiRequest("/api/planning/published", { method: "GET" })
};

