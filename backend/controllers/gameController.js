const rooms = {}; 

const handleSocketEvents = (io, socket) => {
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { players: { X: socket.id }, moves: {} };
      socket.emit("playerAssigned", "X");
    } else if (!rooms[roomId].players.O) {
      rooms[roomId].players.O = socket.id;
      socket.emit("playerAssigned", "O");
      io.to(roomId).emit("startGame");
    } else {
      socket.emit("roomFull");
    }
  });

  socket.on("move", ({ roomId, position, player }) => {
    if (rooms[roomId]) {
      rooms[roomId].moves[position] = player;
      io.to(roomId).emit("moveMade", { position, player });
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      if (Object.values(rooms[roomId].players).includes(socket.id)) {
        io.to(roomId).emit("playerDisconnected");
        delete rooms[roomId];
        break;
      }
    }
  });
};

module.exports = { handleSocketEvents };
