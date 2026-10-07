import { api } from './api'; export const orderApi = { create: order => api('/api/orders',{method:'POST',body:JSON.stringify(order)}), list: () => api('/api/orders') };
