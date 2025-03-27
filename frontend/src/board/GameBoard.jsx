import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Celebration from "../components/celebration";
import "./GameBoard.css";

const socket = io("http://localhost:5000"); 

function GameBoard() {
  const positions = {
    A: [50, 50], B: [225, 50], C: [400, 50],
    D: [50, 225], E: [225, 225], F: [400, 225],
    G: [50, 400], H: [225, 400], I: [400, 400],
  };

  const validMoves = {
    A: ["B", "D", "E"], B: ["A", "C", "E"], C: ["B", "E", "F"],
    D: ["A", "E", "G"], E: ["A", "B", "C", "D", "F", "G", "H", "I"],
    F: ["C", "E", "I"], G: ["D", "E", "H"], H: ["E", "G", "I"], I: ["E", "F", "H"],
  };

  const [pieces, setPieces] = useState({ A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null });
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [winner, setWinner] = useState(null);
  const [placedPieces, setPlacedPieces] = useState({ X: 0, O: 0 });
  const [showCelebration, setShowCelebration] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState(null); 

  const [roomId, setRoomId] = useState(""); 
  const [joinedRoom, setJoinedRoom] = useState(false); 

  useEffect(() => {
    socket.on("gameState", (data) => {
      if (data.roomId === roomId) {
        setPieces(data.pieces);
        setCurrentPlayer(data.currentPlayer);
        setWinner(data.winner);
        setPlacedPieces(data.placedPieces);
        setShowCelebration(data.winner !== null);
      }
    });

    socket.on("assignSymbol", (symbol) => {
      console.log("Assigned symbol:", symbol);
      setPlayerSymbol(symbol);
    });

    return () => {
      socket.off("gameState");
      socket.off("assignSymbol");
    };
  }, [roomId]);

  const joinRoom = () => {
    if (roomId.trim()) {
      socket.emit("joinRoom", roomId);
      setJoinedRoom(true);
    }
  };

  const handleClick = (pos) => {
    console.log(`Attempting move: Player ${playerSymbol} at ${pos}`);
    if (!playerSymbol || winner || currentPlayer !== playerSymbol) return; 
    console.log('passwed')
  
    if (placedPieces[currentPlayer] < 3) {
      if (!pieces[pos]) {
        console.log('emition',{ pos, player: playerSymbol, selectedPiece: null, roomId })
        socket.emit("makeMove", { pos, player: playerSymbol, selectedPiece: null, roomId });
      }
    } else {
      console.log('selected piece',selectedPiece)
      if (!selectedPiece) {
        if (pieces[pos] === currentPlayer) {
          setSelectedPiece(pos);
        }
      } else {
        if (!pieces[pos] && validMoves[selectedPiece]?.includes(pos)) {
          // Send movement move to server with roomId
          socket.emit("makeMove", { pos, player: playerSymbol, selectedPiece, roomId });
        }
        setSelectedPiece(null);
      }
    }
  };

  return (
    <div>
      
      <h1 id="heading">Game of Lies</h1>

      {!joinedRoom ? (
        <div className="join-room">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div className="container">
          <div className="details">
            <h2 style={{ color: currentPlayer === "X" ? "rgb(255, 3, 255)" : "rgb(115, 255, 0)" }}>
              {winner ? `Player ${winner} Wins!` : `Player ${currentPlayer} Turn`}
            </h2>
            <h3>You are playing as: {playerSymbol || "Waiting for opponent..."}</h3>
            <h4>Room ID: {roomId}</h4>
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
      )}

      {showCelebration && <Celebration winner={winner} onClose={() => setShowCelebration(false)} />}
    </div>
  );
}

export default GameBoard;
