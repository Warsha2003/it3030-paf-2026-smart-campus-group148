import apiClient from "./axios.js";

const ticketApi = {
  getTickets() {
    return apiClient.get("/tickets");
  }
};

export default ticketApi;
