import { apiRequest } from "./client";

export const authApi = {
  login: ({ email, password }) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    })
};

