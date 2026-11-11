import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// autoConnect false means the socket will not connect automatically on page load. 
// You can call socket.connect later when you want to connect.
export const socket = io(SOCKET_URL, { autoConnect: false });