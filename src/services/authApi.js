import { api } from './api';
export const authApi = { login: payload => api('/api/auth/login', {method:'POST', body:JSON.stringify(payload)}), register: payload => api('/api/auth/register', {method:'POST', body:JSON.stringify(payload)}) };
