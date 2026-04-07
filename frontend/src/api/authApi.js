import apiClient from "./axios.js";

const authApi = {
  login(payload) {
    return apiClient.post("/auth/login", payload);
  },
  logout() {
    return apiClient.post("/auth/logout");
  }
};

export default authApi;
