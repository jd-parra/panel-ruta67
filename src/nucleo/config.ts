// Único lugar que lee las variables de entorno de Vite.
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

export const API_URL = `${BASE.replace(/\/$/, '')}/api/v1`;
export const SOCKET_URL = BASE;

// Centro de Mérida.
export const CENTRO_MERIDA: [number, number] = [8.5897, -71.1561];
