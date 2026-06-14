import { ManagerOptions, SocketOptions } from "socket.io-client";

export const socketOptions: Partial<ManagerOptions & SocketOptions> = {
  autoConnect: false,
  
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,       // start retrying after 1 second
  reconnectionDelayMax: 5000,    // cap backoff at 5 seconds
  randomizationFactor: 0.5,      // jitter to avoid thundering herd
  
  timeout: 20000,                // connection attempt timeout
  
  retries: 3,                    // retry individual packet sends
  ackTimeout: 10000,             // how long to wait for an ack before retry
  
  rememberUpgrade: true,         // skip polling on reconnect if websocket worked before
  
  transports: ["websocket", "polling"], // websocket first, polling fallback
};

