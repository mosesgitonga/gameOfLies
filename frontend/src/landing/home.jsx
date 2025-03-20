import { useState } from "react";
import Celebration from "../components/celebration";
import "./home.css";

function GameBoard() {
  const positions = {
    A: [50, 50], B: [225, 50], C: [400, 50],
    D: [50, 225], E: [225, 225], F: [400, 225],
    G: [50, 400], H: [225, 400], I: [400, 400],
  };

  const validMoves = {
    A: ["B", "D", "E"],
    B: ["A", "C", "E"],
    C: ["B", "E", "F"],
    D: ["A", "E", "G"],
    E: ["A", "B", "C", "D", "F", "G", "H", "I"],
    F: ["C", "E", "I"],
    G: ["D", "E", "H"],
    H: ["E", "G", "I"],
    I: ["E", "F", "H"],
  };

  const [pieces, setPieces] = useState({ A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null });
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [winner, setWinner] = useState(null);
  const [placedPieces, setPlacedPieces] = useState({ X: 0, O: 0 });
  const [showCelebration, setShowCelebration] = useState(false);


  const checkWinner = (newPieces) => {
    const winningLines = [
      ["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"], // Rows
      ["A", "D", "G"], ["B", "E", "H"], ["C", "F", "I"], // Columns
      ["A", "E", "I"], ["C", "E", "G"], // Diagonals
    ];

    for (let line of winningLines) {
      if (line.every(pos => newPieces[pos] === "X")) {
        setShowCelebration(true);
        return "X";
      }
      if (line.every(pos => newPieces[pos] === "O")) {
        setShowCelebration(true);
        return "O";
      }
    }
    return null;
  };


  const handleClick = (pos) => {
    if (winner) return;

    if (placedPieces[currentPlayer] < 3) {
      if (!pieces[pos]) {
        let newPieces = { ...pieces, [pos]: currentPlayer };
        setPieces(newPieces);
        setPlacedPieces({ ...placedPieces, [currentPlayer]: placedPieces[currentPlayer] + 1 });

        const winner = checkWinner(newPieces);
        if (winner) {
          setWinner(winner);
        } else {
          setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
        }
      }
    } else {
      if (!selectedPiece) {
        if (pieces[pos] === currentPlayer) {
          setSelectedPiece(pos);
        }
      } else {
        if (!pieces[pos] && validMoves[selectedPiece]?.includes(pos)) {
          let newPieces = { ...pieces, [selectedPiece]: null, [pos]: currentPlayer };
          setPieces(newPieces);
          setWinner(checkWinner(newPieces));
          setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
        }
        setSelectedPiece(null);
      }
    }
  };

  return (
    <div>
      <h1 id="heading">Game of Lies 🎭</h1>

      <div className="container">
        <div className="details">
          <h2 style={{ color: currentPlayer === "X" ? "rgb(255, 3, 255)" : "blue" }}>
            {winner ? `Player ${winner} Wins!` : `Player ${currentPlayer} Turn`}
          </h2>


        </div>

        <div className="board-container">
          <svg className="lines" width="450" height="450" viewBox="0 0 450 450">
            <line x1="50" y1="50" x2="400" y2="50" stroke="white" strokeWidth="3" />
            <line x1="50" y1="225" x2="400" y2="225" stroke="white" strokeWidth="3" />
            <line x1="50" y1="400" x2="400" y2="400" stroke="white" strokeWidth="3" />

            <line x1="50" y1="50" x2="50" y2="400" stroke="white" strokeWidth="3" />
            <line x1="225" y1="50" x2="225" y2="400" stroke="white" strokeWidth="3" />
            <line x1="400" y1="50" x2="400" y2="400" stroke="white" strokeWidth="3" />

            <line x1="50" y1="50" x2="400" y2="400" stroke="white" strokeWidth="3" />
            <line x1="400" y1="50" x2="50" y2="400" stroke="white" strokeWidth="3" />
          </svg>

          {Object.entries(positions).map(([pos, [x, y]]) => (
            <div
              key={pos}
              className="position-marker"
              style={{ left: `${x}px`, top: `${y}px` }}
              onClick={() => handleClick(pos)}
            >
              {pos}
            </div>
          ))}

          {Object.entries(pieces).map(([pos, player]) =>
            player ? (
              <div
                key={pos}
                className={`piece ${player} ${selectedPiece === pos ? "selected" : ""}`}
                style={{ left: `${positions[pos][0]}px`, top: `${positions[pos][1]}px` }}
                onClick={() => handleClick(pos)}
              >
                {player}
              </div>
            ) : null
          )}
        </div>
        {winner && <button onClick={() => window.location.reload()}>Restart</button>}

      </div>


      {showCelebration && <Celebration winner={winner} onClose={() => setShowCelebration(false)} />}
    </div>
  );
};

export default GameBoard;
