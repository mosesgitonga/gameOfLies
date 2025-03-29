import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import GameBoard from "../board/GameBoard";
import "./styles/MyGames.css";

const MyGames = () => {
    const [userGames, setUserGames] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserGames = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:5000/api/user/games/${user.id}`);
                const data = await response.json();
                console.log("Fetched user games:", data); // Debug log
                setUserGames(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching games:", error);
                setUserGames([]);
            }
            setLoading(false);
        };
        fetchUserGames();
    }, [user.id]);

    return (
        <div className="my-games-container">
            <h1>My Games</h1>
            {loading ? (
                <p>Loading games...</p>
            ) : userGames.length === 1 ? (
                <div className="single-game-layout">
                    <aside className="game-details">
                        <h2>Your Active Game</h2>
                        <div className="my-game-item">
                            <span>Challenger - {userGames[0].challenger} - ({userGames[0].status})</span>
                            <button onClick={() => { /* Add destroy logic */ }}>Destroy</button>
                        </div>
                    </aside>
                    <div className="gameboard-wrapper">
                        {console.log("Passing roomId to GameBoard:", userGames[0].id)}
                        <GameBoard roomId={userGames[0].id || "default-room"} /> {/* Fallback if id is undefined */}
                    </div>
                </div>
            ) : userGames.length > 1 ? (
                <ul className="my-games-list">
                    {userGames.map((game) => (
                        <li key={game.id} className="my-game-item">
                            <span>Challenger - {game.challenger} - ({game.status})</span>
                            <button onClick={() => { /* Add destroy logic */ }}>Destroy</button>
                            <button onClick={() => navigate(`/game/${game.gameId}`)}>Play</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>
                    You don’t have any games. <br />
                    <button onClick={() => navigate("/create-game")}>Create new Game</button>
                </p>
            )}
        </div>
    );
};

export default MyGames;