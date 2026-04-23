import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('smart_campus_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ticketApi = {

  // --- Tickets ---
  getAllTickets() {
    return axios.get(`${API_BASE}/tickets`, {
      headers: getAuthHeader()
    });
  },

  getTicketById(id) {
    return axios.get(`${API_BASE}/tickets/${id}`, {
      headers: getAuthHeader()
    });
  },

  getMyTickets(userId) {
    return axios.get(`${API_BASE}/tickets/user/${userId}`, {
      headers: getAuthHeader()
    });
  },

  getTicketsByStatus(status) {
    return axios.get(`${API_BASE}/tickets/status/${status}`, {
      headers: getAuthHeader()
    });
  },

  createTicket(ticketData, imageFiles) {
    const formData = new FormData();
    formData.append(
      'ticket',
      new Blob([JSON.stringify(ticketData)], { type: 'application/json' })
    );
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach(file => formData.append('images', file));
    }
    return axios.post(`${API_BASE}/tickets`, formData, {
      headers: { ...getAuthHeader() }
    });
  },

  updateTicketStatus(id, status, resolutionNotes, rejectionReason) {
    return axios.patch(`${API_BASE}/tickets/${id}/status`,
      { status, resolutionNotes, rejectionReason },
      { headers: getAuthHeader() }
    );
  },

  assignTechnician(ticketId, technicianId) {
    return axios.patch(`${API_BASE}/tickets/${ticketId}/assign`,
      { technicianId },
      { headers: getAuthHeader() }
    );
  },

  deleteTicket(id) {
    return axios.delete(`${API_BASE}/tickets/${id}`, {
      headers: getAuthHeader()
    });
  },

  // INNOVATION 1 - Get statistics
  getStats() {
    return axios.get(`${API_BASE}/tickets/stats`, {
      headers: getAuthHeader()
    });
  },

  // INNOVATION 2 - Search tickets
  searchTickets(keyword) {
    return axios.get(`${API_BASE}/tickets/search?keyword=${keyword}`, {
      headers: getAuthHeader()
    });
  },

  // --- Comments ---
  getComments(ticketId) {
    return axios.get(`${API_BASE}/tickets/${ticketId}/comments`, {
      headers: getAuthHeader()
    });
  },

  addComment(ticketId, userId, username, content) {
    return axios.post(`${API_BASE}/tickets/${ticketId}/comments`,
      { userId, username, content },
      { headers: getAuthHeader() }
    );
  },

  updateComment(commentId, userId, content) {
    return axios.put(`${API_BASE}/tickets/comments/${commentId}`,
      { userId, content },
      { headers: getAuthHeader() }
    );
  },

  deleteComment(commentId, userId) {
    return axios.delete(
      `${API_BASE}/tickets/comments/${commentId}?userId=${userId}`,
      { headers: getAuthHeader() }
    );
  }
};

export default ticketApi;