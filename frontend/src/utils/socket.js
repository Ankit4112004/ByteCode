import { io } from "socket.io-client";

// Single shared socket connection to the backend (same base URL as the API).
const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
  autoConnect: true,
});

export default socket;
