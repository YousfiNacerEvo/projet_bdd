import { apiRequest } from "./client";

export const planningApi = {
  getPublished: () => apiRequest("/api/planning/published", { method: "GET" })
};

