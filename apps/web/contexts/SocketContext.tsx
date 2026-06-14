"use client";
import { socketOptions } from "@/config/socket";
import { useAuth } from "@clerk/nextjs";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Callback<TArgs = unknown> = (args?: TArgs) => void;
interface SocketEventPayloads {

    // Connection related events
    "connect": void,
    "connect_error": Error,
    "disconnect": Socket.DisconnectReason,
    "reconnect_attempt": any,
    "reconnect": any,
    "reconnection_failed": any,


};
interface RegisterListenerArgs<K extends keyof SocketEventPayloads> {
    event: K,
    callback: Callback<SocketEventPayloads[K]>;
};

interface SocketContextType {
    socket: Socket | null;
    registerListener: <K extends keyof SocketEventPayloads>(args: RegisterListenerArgs<K>) => void;
}


const SocketContext = createContext<SocketContextType | null>(null);

export function SocketContextProvider({ children, url }: { children: React.ReactNode; url: string }) {
    const { getToken, isSignedIn } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const socketRef = useRef<Socket | null>(null);

    // Registers a listener for a specific event
    const registerListener = useCallback(<T extends keyof SocketEventPayloads>({
        event,
        callback,
    }: RegisterListenerArgs<T>) => {
        const currentSocket = socketRef.current;
        console.log("Current socket:", currentSocket);
        if (!currentSocket) return;

        // Create an explicit wrapper function that matches the standard (...args) layout
        const internalListener = (...args: any[]) => {
            // Grab the first argument coming from the socket stream and pass it down
            callback(args[0] as SocketEventPayloads[T]);
        };

        // Mount the clean internal layout instead
        currentSocket.on(event as string, internalListener);
        return () => currentSocket.off(event as string, internalListener);
    }, []);


    useEffect(() => {
        if (!isSignedIn) return;

        const initSocket = async () => {
            // Fetch the raw Clerk session token
            const token = await getToken();

            // Pass it to the Socket.io client auth payload
            // to make sure only authenticated users can connect
            const socketInstance = io(url, {
                ...socketOptions,
                auth: { token: token },
            });

            // Connect manually because "autoConnect" option is set to false
            socketInstance.connect();

            // Attach the instance to the state and the ref
            socketRef.current = socketInstance;
            setSocket(socketInstance);

            // Register connection-related listeners immediately after
            // connection and attaching socketInstance to the ref
            registerListener({
                event: "connect",
                callback: () => console.log("Connected ✅"),
            });

            registerListener({
                event: "connect_error",
                callback: (err) => console.log("Connection error:", err)
            });

            registerListener({
                event: "disconnect",
                callback: (reason) => console.log("Disconnected:", reason)
            });

            registerListener({
                event: "reconnect_attempt",
                callback: (attempt) => console.log(`Reconnecting to server... Try #${attempt}`)
            });

            registerListener({
                event: "reconnect",
                callback: (attempt) => console.log(`Successfully recovered connection on try #${attempt}!`)
            });

            registerListener({
                event: "reconnection_failed",
                callback: () => console.error("All reconnection attempts exhausted.")
            });
        };

        initSocket();

        // Disconnect the socket when the component unmounts
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
        };
    }, [isSignedIn, getToken, url]);

    return (
        <SocketContext.Provider value={{ socket, registerListener }}>
            {children}
        </SocketContext.Provider>
    );
}

// Custom hook to consume the shared global connection
export function useSocketContext() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocketContext must be used within a SocketContextProvider");
    }
    return context;
}