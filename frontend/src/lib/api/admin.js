import { apiRequest } from "./client";

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

