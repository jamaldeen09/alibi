import { Server } from "socket.io";
import http from "http";
// create a new http server
const server = http.createServer();

// initialize socket.io's server API
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },

    connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 60 * 1000,
        skipMiddlewares: false,
    }
});

// set an on connection event
io.on("connection", (socket) => {
    console.log("A new socket client is connected! with id:", socket.id);
})


// start the server
server.listen(4080, () => console.log("Server is running on: http://localhost:4080"));