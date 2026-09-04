import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const atsApi = {
  // Dashboard
  getDashboard: () => api.get('/ats/dashboard'),
  
  // Jobs
  getJobs: () => api.get('/ats/jobs'),
  getJob: (id) => api.get(`/ats/jobs/${id}`),
  createJob: (data) => api.post('/ats/jobs', data),
  updateJob: (id, data) => api.put(`/ats/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/ats/jobs/${id}`),
  
  // Applications
  getApplications: (params) => api.get('/ats/applications', { params }),
  getApplication: (id) => api.get(`/ats/applications/${id}`),
  createApplication: (data) => api.post('/ats/applications', data),
  updateApplication: (id, data) => api.put(`/ats/applications/${id}`, data),
  deleteApplication: (id) => api.delete(`/ats/applications/${id}`),
  updateApplicationStatus: (id, status) => api.patch(`/ats/applications/${id}/status`, { status }),
  
  // Applicants
  getApplicants: () => api.get('/ats/applicants'),
  getApplicant: (id) => api.get(`/ats/applicants/${id}`),
  
  // Analytics
  getAnalytics: () => api.get('/ats/analytics'),
};

export default api;
