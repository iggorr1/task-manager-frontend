import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://api.wwwho.lol";

function authConfig(jwt) {
  return {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  };
}

export function getRequestErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || fallbackMessage;
}

export function isUnauthorizedError(error) {
  return error?.response?.status === 401;
}

export function isSessionAuthError(error) {
  const status = error?.response?.status;
  return status === 401 || status === 403;
}

export const authApi = {
  register(payload) {
    return axios.post(`${API_URL}/users/register`, payload);
  },

  login(payload) {
    return axios.post(`${API_URL}/users/login`, payload);
  },

  getGoogleLoginUrl() {
    return `${API_URL}/oauth2/authorization/google`;
  },
};

export const taskApi = {
  getTasks(jwt, params) {
    return axios.get(`${API_URL}/tasks`, {
      ...authConfig(jwt),
      params,
    });
  },

  createTask(jwt, payload) {
    return axios.post(`${API_URL}/tasks`, payload, authConfig(jwt));
  },

  updateTask(jwt, taskId, payload) {
    return axios.put(`${API_URL}/tasks/${taskId}`, payload, authConfig(jwt));
  },

  togglePin(jwt, taskId) {
    return axios.patch(`${API_URL}/tasks/${taskId}/pin`, {}, authConfig(jwt));
  },

  updateStatus(jwt, taskId, payload) {
    return axios.patch(`${API_URL}/tasks/${taskId}/status`, payload, authConfig(jwt));
  },

  deleteTask(jwt, taskId) {
    return axios.delete(`${API_URL}/tasks/${taskId}`, authConfig(jwt));
  },

  setReminder(jwt, taskId, payload) {
    return axios.patch(`${API_URL}/tasks/${taskId}/reminder`, payload, authConfig(jwt));
  },

  deleteReminder(jwt, taskId) {
    return axios.delete(`${API_URL}/tasks/${taskId}/reminder`, authConfig(jwt));
  },
};

export const adminApi = {
  getStats(jwt) {
    return axios.get(`${API_URL}/admin/stats`, authConfig(jwt));
  },

  getUsers(jwt) {
    return axios.get(`${API_URL}/admin/users`, authConfig(jwt));
  },

  getTasks(jwt) {
    return axios.get(`${API_URL}/admin/tasks`, authConfig(jwt));
  },
};

export const telegramApi = {
  getStatus(jwt) {
    return axios.get(`${API_URL}/telegram/status`, authConfig(jwt));
  },

  createLink(jwt) {
    return axios.post(`${API_URL}/telegram/link`, {}, authConfig(jwt));
  },

  disconnect(jwt) {
    return axios.delete(`${API_URL}/telegram/disconnect`, authConfig(jwt));
  },
};
