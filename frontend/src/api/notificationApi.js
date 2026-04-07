import apiClient from "./axios.js";

const notificationApi = {
  getNotifications() {
    return apiClient.get("/notifications");
  }
};

export default notificationApi;
