import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket: Socket | null = null;

/** Una sola conexión Socket.IO por sesión (contrato §11). */
export function conectarSocket(token: string): Socket {
  socket ??= io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
  return socket;
}

export function desconectarSocket() {
  socket?.disconnect();
  socket = null;
}
