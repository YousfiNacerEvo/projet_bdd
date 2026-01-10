import { apiRequest } from "./client";

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

