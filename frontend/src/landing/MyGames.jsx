import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "./styles/MyGames.css";

const MyGames = () => {
    const [userGames, setUserGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createdGame, setCreatedGame] = useState(null);
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);
    const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
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
                const access_token = localStorage.getItem("access_token");
                console.log("Fetching games - Access token:", access_token);
                if (!access_token) throw new Error("No access token found");

                const response = await fetch(`http://localhost:5000/api/user/games/${user.id}`, {
                    headers: {
                        "Authorization": `Bearer ${access_token}`
                    }
                });
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
    }, [user, isAuthenticated, authLoading]); // Depend on authLoading too

    const createGame = async () => {
        if (!isAuthenticated || !user || !user.id) {
            alert("Please log in to create a game.");
            navigate("/login");
            return;
        }

        const access_token = localStorage.getItem("access_token");
        if (!access_token) {
            alert("Authentication token missing. Please log in again.");
            navigate("/login");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("http://localhost:5000/api/game", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${access_token}`
                },
                body: JSON.stringify({ player1Id: user.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setCreatedGame({ gameId: data.gameId });
                    setShowCreateDropdown(true);
                    console.log("Existing pending game:", data.gameId);
                    return;
                }
                throw new Error(data.message || "Failed to create game");
            }

            setCreatedGame(data);
            setShowCreateDropdown(true);
            setUserGames([...userGames, { gameId: data.gameId, challenger: user.username, status: "pending" }]);
            console.log("New game created:", data);
        } catch (error) {
            console.error("Error creating game:", error);
            alert(`Failed to create game: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const copyShareLink = (gameId) => {
        const shareLink = `${window.location.origin}/game/${gameId}`;
        navigator.clipboard.writeText(shareLink);
        alert("Game link copied to clipboard!");
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
                            <span>Challenger: {game.challenger} ({game.status})</span>
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
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="no-games">
                    <p>You don’t have any games.</p>
                    <button onClick={createGame} disabled={loading}>
                        {loading ? "Creating..." : "Create New Game"}
                    </button>
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
            )}
        </div>
    );
};

export default MyGames;