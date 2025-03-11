import { useState } from "react";
import "./App.css";

function GameBoard() {
  // Define valid positions (junctions where lines meet)
  const positions = {
    "A": [50, 50],  "B": [150, 50],  "C": [250, 50],
    "D": [50, 150], "E": [150, 150], "F": [250, 150],
    "G": [50, 250], "H": [150, 250], "I": [250, 250],
  };

  // Define valid moves between positions
  const validMoves = {
    A: ["B", "D", "E"],
    B: ["A", "C", "E"],
    C: ["B", "E", "F"],
    D: ["A", "E", "G"],
    E: ["A", "B", "C", "D", "F", "G", "H", "I"], // Center connects to all
    F: ["C", "E", "I"],
    G: ["D", "E", "H"],
    H: ["E", "G", "I"],
    I: ["E", "F", "H"],
  };

  const [pieces, setPieces] = useState({ A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null });
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [winner, setWinner] = useState(null);
  const [placedPieces, setPlacedPieces] = useState({ X: 0, O: 0 });

  const checkWinner = (newPieces) => {
    const winningLines = [
      ["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"], // Rows
      ["A", "D", "G"], ["B", "E", "H"], ["C", "F", "I"], // Columns
      ["A", "E", "I"], ["C", "E", "G"], // Diagonals
    ];

    for (let line of winningLines) {
      if (line.every(pos => newPieces[pos] === "X")) return "X";
      if (line.every(pos => newPieces[pos] === "O")) return "O";
    }
    return null;
  };

  const handleClick = (pos) => {
    if (winner || pieces[pos]) return;
    if (placedPieces[currentPlayer] < 3) {
      let newPieces = { ...pieces, [pos]: currentPlayer };
      setPieces(newPieces);
      setPlacedPieces(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
      setWinner(checkWinner(newPieces));
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  };

  const handleMouseDown = (pos) => {
    if (pieces[pos] === currentPlayer && placedPieces[currentPlayer] === 3) {
      setDraggedPiece(pos);
    }
  };

  const handleMouseUp = (pos) => {
    if (!draggedPiece || winner || pieces[pos]) return;
    const from = draggedPiece;
    if (validMoves[from]?.includes(pos)) {
      let newPieces = { ...pieces, [from]: null, [pos]: currentPlayer };
      setPieces(newPieces);
      setWinner(checkWinner(newPieces));
      setDraggedPiece(null);
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  };

  return (
    <div>
      <h1>Three Men’s Morris</h1>
      <h2>{winner ? `Player ${winner} Wins!` : `Current Player: ${currentPlayer}`}</h2>

      <div className="board-container">
        {/* SVG for lines */}
        <svg className="lines" width="300" height="300">
          {Object.entries(validMoves).map(([from, toList]) => {
            const [fromX, fromY] = positions[from];
            return toList.map((to) => {
              const [toX, toY] = positions[to];
              return (
                <line
                  key={`${from}-${to}`}
                  x1={fromX} y1={fromY} x2={toX} y2={toY}
                  stroke="gray" strokeWidth="3"
                />
              );
            });
          })}
        </svg>

        {/* Interactive pieces */}
        {Object.entries(positions).map(([pos, [x, y]]) => (
          <div
            key={pos}
            className={`piece ${pieces[pos] || ""}`}
            style={{ left: `${x - 15}px`, top: `${y - 15}px` }}
            onClick={() => handleClick(pos)}
            onMouseDown={() => handleMouseDown(pos)}
            onMouseUp={() => handleMouseUp(pos)}
          >
            {pieces[pos]}
          </div>
        ))}
      </div>

      {winner && <button onClick={() => window.location.reload()}>Restart</button>}
    </div>
  );
}

export default GameBoard;
