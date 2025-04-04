import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import CreateGame from "../components/CreateGame"
import "./styles/MyGames.css";
import { basename } from "path";

const MyGames = () => {
    const [userGames, setUserGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createdGame, setCreatedGame] = useState(null);
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);
    const { user, isAuthenticated, loading: authLoading, fetchWithAuth } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("MyGames useEffect - User:", user, "isAuthenticated:", isAuthenticated, "authLoading:", authLoading);

        const fetchUserGames = async () => {
            if (authLoading) {
                console.log("Auth still loading, waiting...");
                return;
            }

            if (!isAuthenticated || !user || !user.id) {
                console.log("Not authenticated or no user ID, skipping fetch");
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                console.log("Fetching games for user:", user.id);
                const response = await fetchWithAuth(`${base_url}/api/user/games/${user.id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to fetch games");
                }

                const data = await response.json();
                console.log("Fetched user games:", data);
                setUserGames(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching games:", error);
                setUserGames([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUserGames();
    }, [user, isAuthenticated, authLoading, fetchWithAuth]);

    const handleGameCreated = (newGame) => {
        console.log("Game created in MyGames:", newGame);
        setCreatedGame(newGame);
        setShowCreateDropdown(true);
        setUserGames([...userGames, { 
            gameId: newGame.gameId, 
            challenger: user.username, 
            status: "pending" 
        }]);
    };

    const copyShareLink = (gameId) => {
        const shareLink = `${window.location.origin}/game/${gameId}`;
        navigator.clipboard.writeText(shareLink);
        alert("Game link copied to clipboard!");
    };

    const destroyGame = async (gameId) => {
        if (!window.confirm("Are you sure you want to delete this game?")) return;

        try {
            const response = await fetchWithAuth(`${base_url}/api/game/destroy/${gameId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete game");
            }

            const data = await response.json();
            console.log("Game deleted:", data);
            setUserGames(userGames.filter(game => game.gameId !== gameId));
            if (createdGame && createdGame.gameId === gameId) {
                setCreatedGame(null);
                setShowCreateDropdown(false);
            }
            alert("Game deleted successfully!");
        } catch (error) {
            console.error("Error deleting game:", error);
            alert(`Failed to delete game: ${error.message}`);
        }
    };

    if (authLoading) {
        return <div>Loading authentication...</div>;
    }

    if (!isAuthenticated || !user || !user.id) {
        return (
            <div className="my-games-container">
                <h1>My Games</h1>
                <p>Please log in to view your games.</p>
                <button onClick={() => navigate("/login")}>Go to Login</button>
            </div>
        );
    }

    return (
        <div className="my-games-container">
            <h1>My Games</h1>
            {loading ? (
                <p>Loading games...</p>
            ) : userGames.length > 0 ? (
                <ul className="my-games-list">
                    {userGames.map((game) => (
                        <li key={game.gameId} className="my-game-item">
                            <span>{game.challenger} VS {game.opponent || "Waiting"} </span>
                            <span>({game.status})</span>
                            <div className="button-group">
                                <button
                                    onClick={() => copyShareLink(game.gameId)}
                                    className="invite-button"
                                >
                                    Invite
                                </button>
                                <button
                                    onClick={() => navigate(`/game/${game.gameId}`)}
                                    className="go-to-game-button"
                                >
                                    Go to Game Room
                                </button>
                                {game.status === "pending" && game.challenger === user.username && (
                                    <button
                                        onClick={() => destroyGame(game.gameId)}
                                        className="destroy-game-button"
                                        style={{ background: "red" }}
                                    >
                                        Destroy
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="no-games">
                    <p>You don’t have any games.</p>
                </div>
            )}
            {/* Integrate CreateGame component */}
            <CreateGame onGameCreated={handleGameCreated} />
            {showCreateDropdown && createdGame && (
                <div className="create-game-dropdown">
                    <h3>
                        {userGames.some(g => g.gameId === createdGame.gameId)
                            ? "Existing Game"
                            : "Game Created!"}
                    </h3>
                    <p>
                        Share this link to invite a player:{" "}
                        <span className="share-link">
                            {`${window.location.origin}/game/${createdGame.gameId}`}
                        </span>
                    </p>
                    <div className="dropdown-buttons">
                        <button onClick={() => copyShareLink(createdGame.gameId)}>
                            Copy Link
                        </button>
                        <button
                            onClick={() => navigate(`/game/${createdGame.gameId}`)}
                            style={{ background: "#28a745" }}
                        >
                            Go to Game Room
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyGames;