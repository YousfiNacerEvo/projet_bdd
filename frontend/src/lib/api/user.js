import { apiRequest } from "./client";

export const getMe = async () => {
  return apiRequest("/api/me", { method: "GET" });
};

