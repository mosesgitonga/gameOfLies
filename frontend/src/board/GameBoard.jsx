import { useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Celebration from "../components/celebration";
import { AuthContext } from "../auth/AuthContext";
import "./GameBoard.css";

const socket = io("http://localhost:5000", {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: false,
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

    const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const effectiveRoomId = propRoomId || id;

    const [pieces, setPieces] = useState({
        A: null, B: null, C: null, D: null, E: null,
        F: null, G: null, H: null, I: null,
    });
    const [currentPlayer, setCurrentPlayer] = useState("X");
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [winner, setWinner] = useState(null);
    const [placedPieces, setPlacedPieces] = useState({ X: 0, O: 0 });
    const [showCelebration, setShowCelebration] = useState(false);
    const [playerSymbol, setPlayerSymbol] = useState(null);
    const [gameReady, setGameReady] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userBalance, setUserBalance] = useState(0);
    const [showBetPopup, setShowBetPopup] = useState(false);
    const [betAmount, setBetAmount] = useState(0);

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated || !user) {
            const redirectUrl = location.pathname + location.search;
            navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
            return;
        }

        if (!effectiveRoomId) {
            setError("No game room ID provided.");
            setLoading(false);
            return;
        }

        // Connect socket early
        socket.connect();
        socket.on("connect", () => {
            console.log("Socket connected, joining room:", effectiveRoomId);
            socket.emit("joinRoom", { roomId: effectiveRoomId, userId: user.id });
        });

        const initializeGame = async () => {
            try {
                console.log("Initializing game with ID:", effectiveRoomId);
                const token = localStorage.getItem("access_token");
                if (!token) throw new Error("No access token found");

                // Fetch user balance
                const userResponse = await fetch(`http://localhost:5000/api/auth/user`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!userResponse.ok) throw new Error(`Failed to fetch user: ${userResponse.status}`);
                const userData = await userResponse.json();
                setUserBalance(userData.user.balance);

                // Fetch game state
                const response = await fetch(`http://localhost:5000/api/game/${effectiveRoomId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Fetch game failed: ${response.status} - ${errorData.message || await response.text()}`);
                }
                const game = await response.json();
                console.log("Game state fetched:", game);

                const isPlayer1 = game.player1Id === user.id;
                const isPlayer2 = game.player2Id === user.id;

                if (isPlayer1 || isPlayer2) {
                    // Existing player: set state from game data
                    setPieces(game.state.pieces || pieces);
                    setCurrentPlayer(game.state.currentPlayer || "X");
                    setPlacedPieces(game.state.placedPieces || { X: 0, O: 0 });
                    setWinner(game.winnerId ? (game.winnerId === game.player1Id ? "X" : "O") : null);
                    setShowCelebration(!!game.winnerId);
                    setGameReady(game.status === "ongoing" || game.status === "inProgress");
                    setPlayerSymbol(isPlayer1 ? game.player1Symbol : game.player2Symbol);
                    setLoading(false);
                } else if (!game.player2Id && game.status === "pending") {
                    // New player: show bet popup
                    setBetAmount(game.betAmount || 0);
                    setShowBetPopup(true);
                    setLoading(false);
                } else {
                    throw new Error("Game is not joinable (full or finished).");
                }
            } catch (err) {
                console.error("Initialization error:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        initializeGame();

        socket.on("connect_error", (err) => {
            console.error("Socket connect error:", err);
            setError("Failed to connect to game server.");
            setLoading(false);
        });

        socket.on("assignSymbol", ({ userId, symbol }) => {
            console.log("Received assignSymbol:", { userId, symbol });
            if (userId === user.id) setPlayerSymbol(symbol);
        });

        socket.on("gameReady", ({ roomId }) => {
            if (roomId === effectiveRoomId) {
                setGameReady(true);
                setShowBetPopup(false);
                setLoading(false);
                console.log("Game is ready via socket!");
            }
        });

        socket.on("gameResumed", ({ roomId }) => {
            if (roomId === effectiveRoomId) {
                setGameReady(true);
                setError(null);
                setLoading(false);
                console.log("Game resumed via socket!");
            }
        });

        socket.on("gameState", (data) => {
            if (data.roomId === effectiveRoomId) {
                console.log("Received gameState:", data);
                setPieces(data.pieces || pieces);
                setCurrentPlayer(data.currentPlayer || "X");
                setWinner(data.winner);
                setPlacedPieces(data.placedPieces || { X: 0, O: 0 });
                setGameReady(data.gameStarted);
                setShowCelebration(!!data.winner);
                setLoading(false);
            }
        });

        socket.on("roomError", (message) => {
            setError(message);
            if (message.includes("disconnected")) setGameReady(false);
            console.error("Room error:", message);
            setLoading(false);
        });

        return () => {
            socket.off("connect");
            socket.off("connect_error");
            socket.off("assignSymbol");
            socket.off("gameReady");
            socket.off("gameResumed");
            socket.off("gameState");
            socket.off("roomError");
            socket.disconnect();
        };
    }, [effectiveRoomId, user, isAuthenticated, authLoading, navigate, location]);

    const handleAcceptBet = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const joinResponse = await fetch("http://localhost:5000/api/game/join", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ gameId: effectiveRoomId, userId: user.id }),
            });

            if (!joinResponse.ok) {
                const joinErrorData = await joinResponse.json();
                throw new Error(joinErrorData.message || "Failed to join game");
            }

            console.log("Joined game:", await joinResponse.json());
            setShowBetPopup(false);
            socket.emit("joinRoom", { roomId: effectiveRoomId, userId: user.id }); // Sync with socket
        } catch (err) {
            console.error("Join error:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleRejectBet = () => {
        setShowBetPopup(false);
        navigate("/my-games");
    };

    const handleClick = (pos) => {
        if (!playerSymbol || !gameReady || winner || currentPlayer !== playerSymbol) {
            setError("Not your turn, game not started, or game over!");
            console.log("Move blocked:", { playerSymbol, gameReady, winner, currentPlayer });
            return;
        }

        if (placedPieces[currentPlayer] < 3) {
            if (!pieces[pos]) {
                console.log("Placing piece at", pos, "by", playerSymbol);
                socket.emit("makeMove", {
                    pos,
                    player: playerSymbol,
                    selectedPiece: null,
                    roomId: effectiveRoomId,
                    userId: user.id,
                });
            }
        } else if (selectedPiece) {
            if (!pieces[pos] && validMoves[selectedPiece]?.includes(pos)) {
                console.log("Moving piece from", selectedPiece, "to", pos, "by", playerSymbol);
                socket.emit("makeMove", {
                    pos,
                    player: playerSymbol,
                    selectedPiece,
                    roomId: effectiveRoomId,
                    userId: user.id,
                });
                setSelectedPiece(null);
            } else {
                setError("Invalid move!");
                setSelectedPiece(null);
            }
        } else if (pieces[pos] === currentPlayer) {
            setSelectedPiece(pos);
        }
    };

    const handleLeave = () => {
        socket.disconnect();
        navigate("/my-games");
    };

    if (loading) return <div className="gameboard-container">Loading...</div>;

    if (showBetPopup) {
        return (
            <div className="bet-popup">
                <div className="bet-popup-content">
                    <h3>Join Tournament</h3>
                    <p>The creator has set an entry fee of <strong>{betAmount}</strong>.</p>
                    <p>Your balance: {userBalance.toFixed(1)}</p>
                    {userBalance < betAmount && (
                        <p style={{ color: "red" }}>
                            Insufficient balance! <button onClick={() => navigate("/wallet")}>Deposit</button>
                        </p>
                    )}
                    <button onClick={handleAcceptBet} disabled={userBalance < betAmount}>Join</button>
                    <button onClick={handleRejectBet}>Cancel</button>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                </div>
            </div>
        );
    }

    if (authLoading) return <div className="gameboard-container">Loading authentication...</div>;
    if (!isAuthenticated || !user) return <div className="gameboard-container">Redirecting to login...</div>;

    return (
        <div className="gameboard-container">
            <div className="gameboard-content">
                <div className="gameboard-details">
                    <h2 className={`gameboard-player-turn ${currentPlayer}`}>
                        {winner
                            ? `Player ${winner} Wins!`
                            : gameReady
                            ? `Player ${currentPlayer}'s Turn`
                            : "Waiting for game to start..."}
                    </h2>
                    <h3 style={{ color: playerSymbol === "X" ? "rgba(255, 0, 200, 0.8)" : "rgba(115, 255, 0, 0.8)" }}>
                        Your Symbol: {playerSymbol || "Not assigned yet"}
                    </h3>
                    {error && <p className="gameboard-error-message">{error}</p>}
                    {!gameReady && !winner && (
                        <p style={{ color: "red" }}>
                            {error?.includes("disconnected")
                                ? "Opponent disconnected. Waiting for reconnection..."
                                : "Waiting for the second player to join..."}
                        </p>
                    )}
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

                <div className="gameboard-actions">
                    {winner && (
                        <button onClick={() => navigate("/my-games")} className="gameboard-restart-button">
                            Back to Games
                        </button>
                    )}
                    <button onClick={handleLeave} className="gameboard-leave-button">
                        Leave Game
                    </button>
                </div>
            </div>

            {showCelebration && (
                <Celebration
                    winner={winner}
                    playerSymbol={playerSymbol}
                    onClose={() => setShowCelebration(false)}
                />
            )}
        </div>
    );
}

export default GameBoard;