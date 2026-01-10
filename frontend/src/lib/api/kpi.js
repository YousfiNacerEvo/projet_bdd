import { apiRequest } from "./client";

export const kpiApi = {
  get: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.run_id) qs.set("run_id", params.run_id);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiRequest(`/api/kpis${suffix}`, { method: "GET" });
  }
};

