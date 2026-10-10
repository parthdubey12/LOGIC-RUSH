import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket: Socket | null = null;
let authenticatedToken: string | null = null;

function createSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to LogicRush Multiplayer Game Server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from game server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Failed to connect to LogicRush game server:', error.message);
    });
  }
  return socket;
}

export function getSocket(): Socket {
  return createSocket();
}

export function setSocketAuthToken(token: string | null): void {
  const currentSocket = createSocket();
  if (authenticatedToken === token && (currentSocket.connected || !token)) return;

  authenticatedToken = token;
  currentSocket.auth = token ? { token } : {};

  if (!token) {
    currentSocket.disconnect();
    return;
  }

  if (currentSocket.connected) currentSocket.disconnect();
  currentSocket.connect();
}
