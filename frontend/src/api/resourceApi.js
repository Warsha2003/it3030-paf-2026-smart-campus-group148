import apiClient from "./axios.js";

const resourceApi = {
  getResources() {
    return apiClient.get("/resources");
  }
};

export default resourceApi;
