import { api } from './api'; export const cartApi = { get: () => api('/api/cart'), add: item => api('/api/cart',{method:'POST',body:JSON.stringify(item)}) };
