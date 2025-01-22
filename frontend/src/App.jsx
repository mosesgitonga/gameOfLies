import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

function GameBoard() {
  const [board, setBoard] = useState([["", "", ""], ["", "", ""], ["", "", ""]]);
  const [currentPlayer, setCurrentPlayer] = useState(null);

  useEffect(() => {
    // Receive board updates
    socket.on('update-board', (newBoard) => {
      setBoard(newBoard);
    });

    // Receive turn updates
    socket.on('player-turn', (player) => {
      setCurrentPlayer(player);
    });

    // Clean up
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCellClick = (x, y) => {
    socket.emit('place-piece', { x, y });
  };

  return (
    <div className="game-board">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            onClick={() => handleCellClick(rowIndex, colIndex)}
            className={`cell ${cell}`}
          >
            {cell}
          </div>
        ))
      )}
    </div>
  );
}

export default GameBoard;