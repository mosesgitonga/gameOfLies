import { useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import Celebration from "../components/celebration";
import { AuthContext } from "../auth/AuthContext";
import "./GameBoard.css";
import { useParams } from "react-router-dom";

const socket = io("http://localhost:5000", { 
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000 
});

function GameBoard({ roomId: propRoomId }) {
    const positions = {
        A: [12.5, 12.5], B: [50, 12.5], C: [87.5, 12.5],
        D: [12.5, 50], E: [50, 50], F: [87.5, 50],
        G: [12.5, 87.5], H: [50, 87.5], I: [87.5, 87.5],
    };

    const validMoves = {
        A: ["B", "D", "E"], B: ["A", "C", "E"], C: ["B", "E", "F"],
        D: ["A", "E", "G"], E: ["A", "B", "C", "D", "F", "G", "H", "I"],
        F: ["C", "E", "I"], G: ["D", "E", "H"], H: ["E", "G", "I"], I: ["E", "F", "H"],
    };

    const { user } = useContext(AuthContext);
    const [pieces, setPieces] = useState({ 
        A: null, B: null, C: null, D: null, E: null, 
        F: null, G: null, H: null, I: null 
    });
    const [currentPlayer, setCurrentPlayer] = useState("X");
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [winner, setWinner] = useState(null);
    const [placedPieces, setPlacedPieces] = useState({ X: 0, O: 0 });
    const [showCelebration, setShowCelebration] = useState(false);
    const [playerSymbol, setPlayerSymbol] = useState(null);
    const [roomId, setRoomId] = useState("");
    const [joinedRoom, setJoinedRoom] = useState(false);
    const [gameReady, setGameReady] = useState(false); // New state for game readiness
    const [error, setError] = useState(null);

    const { id } = useParams();
    const effectiveRoomId = propRoomId || id || "default-room";

    useEffect(() => {
        if (!user) {
            setError("You must be logged in to play.");
            return;
        }

        console.log("Effective Room ID:", effectiveRoomId);

        if (effectiveRoomId && !joinedRoom) {
            setRoomId(effectiveRoomId);
            setError(null);
            socket.emit("joinRoom", { roomId: effectiveRoomId, userId: user.id });
            setJoinedRoom(true);
        }

        socket.on("connect", () => console.log("Connected to server"));
        socket.on("connect_error", (err) => setError("Connection failed: " + err.message));

        socket.on("gameState", (data) => {
            if (data.roomId === roomId) {
                setPieces(data.pieces);
                setCurrentPlayer(data.currentPlayer);
                setWinner(data.winner);
                setPlacedPieces(data.placedPieces);
                setGameReady(data.gameStarted); // Update game readiness
                setShowCelebration(!!data.winner);
            }
        });

        socket.on("assignSymbol", (data) => {
            console.log("Received assignSymbol:", data);
            if (data.userId === user.id) {
                setPlayerSymbol(data.symbol);
            }
        });

        socket.on("gameReady", (data) => {
            if (data.roomId === roomId) {
                setGameReady(true);
                console.log("Game is ready to start!");
            }
        });

        socket.on("roomError", (message) => {
            setError(message);
            if (message === "Opponent disconnected. Game paused.") {
                setGameReady(false);
            }
        });

        return () => {
            socket.off("connect");
            socket.off("connect_error");
            socket.off("gameState");
            socket.off("assignSymbol");
            socket.off("gameReady");
            socket.off("roomError");
        };
    }, [effectiveRoomId, joinedRoom, roomId, user]);

    const joinRoom = () => {
        if (roomId.trim() && user) {
            setError(null);
            socket.emit("joinRoom", { roomId, userId: user.id });
            setJoinedRoom(true);
        } else {
            setError("Please enter a valid Room ID and ensure you are logged in.");
        }
    };

    const handleClick = (pos) => {
        if (!user || !playerSymbol || !gameReady || winner || currentPlayer !== playerSymbol) return;

        if (placedPieces[currentPlayer] < 3) {
            if (!pieces[pos]) {
                socket.emit("makeMove", { 
                    pos, 
                    player: playerSymbol, 
                    selectedPiece: null, 
                    roomId, 
                    userId: user.id 
                });
            }
        } else if (selectedPiece) {
            if (!pieces[pos] && validMoves[selectedPiece]?.includes(pos)) {
                socket.emit("makeMove", { 
                    pos, 
                    player: playerSymbol, 
                    selectedPiece, 
                    roomId, 
                    userId: user.id 
                });
                setSelectedPiece(null);
            } else {
                setSelectedPiece(null);
            }
        } else if (pieces[pos] === currentPlayer) {
            setSelectedPiece(pos);
        }
    };

    if (!user) {
        return (
            <div className="gameboard-container">
                <p className="gameboard-error-message">Please log in to access the game.</p>
            </div>
        );
    }

    return (
        <div className="gameboard-container">
            {!joinedRoom ? (
                <div className="gameboard-join-room">
                    <input
                        type="text"
                        placeholder="Enter Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="gameboard-room-input"
                    />
                    <button onClick={joinRoom} className="gameboard-join-button">Join Room</button>
                    {error && <p className="gameboard-error-message">{error}</p>}
                </div>
            ) : (
                <div className="gameboard-content">
                    <div className="gameboard-details">
                        <h2 className={`gameboard-player-turn ${currentPlayer}`}>
                            {winner ? `Player ${winner} Wins!` : gameReady ? `Player ${currentPlayer}'s Turn` : "Waiting for opponent..."}
                        </h2>
                        <h3>Your Symbol: {playerSymbol || "Not assigned yet"}</h3>
                        <h4>Room ID: {roomId}</h4>
                        {error && <p className="gameboard-error-message">{error}</p>}
                        {!gameReady && !winner && <p style={{ color: "red" }}>Waiting for the second player to join...</p>
}
                    </div>

                    <div className="gameboard-board-container" style={{ pointerEvents: gameReady ? "auto" : "none" }}>
                        <svg className="gameboard-lines" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                            <line x1="12.5" y1="12.5" x2="87.5" y2="12.5" />
                            <line x1="12.5" y1="50" x2="87.5" y2="50" />
                            <line x1="12.5" y1="87.5" x2="87.5" y2="87.5" />
                            <line x1="12.5" y1="12.5" x2="12.5" y2="87.5" />
                            <line x1="50" y1="12.5" x2="50" y2="87.5" />
                            <line x1="87.5" y1="12.5" x2="87.5" y2="87.5" />
                            <line x1="12.5" y1="12.5" x2="87.5" y2="87.5" />
                            <line x1="87.5" y1="12.5" x2="12.5" y2="87.5" />
                        </svg>

                        {Object.entries(positions).map(([pos, [x, y]]) => (
                            <div
                                key={pos}
                                className="gameboard-position-marker"
                                style={{ left: `${x}%`, top: `${y}%` }}
                                onClick={() => handleClick(pos)}
                            >
                                {pos}
                            </div>
                        ))}

                        {Object.entries(pieces).map(([pos, player]) =>
                            player ? (
                                <div
                                    key={pos}
                                    className={`gameboard-piece ${player} ${selectedPiece === pos ? "selected" : ""}`}
                                    style={{ left: `${positions[pos][0]}%`, top: `${positions[pos][1]}%` }}
                                    onClick={() => handleClick(pos)}
                                >
                                    {player}
                                </div>
                            ) : null
                        )}
                    </div>

                    {winner && (
                        <button onClick={() => window.location.reload()} className="gameboard-restart-button">
                            Restart
                        </button>
                    )}
                </div>
            )}

            {showCelebration && <Celebration winner={winner} onClose={() => setShowCelebration(false)} />}
        </div>
    );
}

export default GameBoard;