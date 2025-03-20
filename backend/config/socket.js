const { Server } = require("socket.io");
const { handleSocketEvents } = require("../controllers/gameController");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    handleSocketEvents(io, socket); 
  });

  return io;
};

module.exports = { initSocket };
