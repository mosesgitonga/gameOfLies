import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import "./home.css";

const Home = () => {
    const [games, setGames] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const { isAuthenticated, user } = useContext(AuthContext);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [createdGame, setCreatedGame] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/games");
                const data = await response.json();
                setGames(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching games:", error);
                setGames([]);
            }
        };
        fetchGames();
    }, []); // Empty dependency array to run only on mount

    const handleToggle = (menu) => {
        setOpenDropdown(openDropdown === menu ? null : menu);
        if (window.innerWidth <= 768) {
            setMenuOpen(false);
        }
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
        setOpenDropdown(null);
    };

    const createGame = async () => {
        if (!isAuthenticated) {
            alert("Please log in to create a game.");
            navigate("/login");
            return;
        }
        let error = ""

        try {
            const response = await fetch("http://localhost:5000/api/game", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    //"Authorization": `Bearer ${localStorage.getItem("access_token")}`
                },
                body: JSON.stringify({ player1Id: user.id }),
            });

            if (!response.ok) {
                error = await response.json()

                throw new Error(error.message);
            }

            const newGame = await response.json();
            setCreatedGame(newGame);
            setOpenDropdown("create-game");
        } catch (error) {
            console.error("Error creating game:", error);
            alert(error.message);
        }
    };

    const copyShareLink = () => {
        const shareLink = `${window.location.origin}/game/${createdGame.gameId}`;
        navigator.clipboard.writeText(shareLink);
        alert("Game link copied to clipboard!");
    };

    return (
        <div className="homeContainer">
            <header>
                <div className={`hamburger ${menuOpen ? "active" : ""}`} onClick={toggleMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <h1 id="heading">Game of Lies</h1>
                <nav>
                    <ul className="nav-list">
                        <li onClick={() => navigate("/about")}>About</li>
                        {isAuthenticated ? (
                            <li>
                                <img
                                    src="/profile-icon.png"
                                    alt="Profile"
                                    className="profile-icon"
                                    onClick={() => navigate("/profile")}
                                />
                            </li>
                        ) : (
                            <>
                                <li onClick={() => navigate("/login")}>Login</li>
                                <li onClick={() => navigate("/register")}>Register</li>
                            </>
                        )}
                    </ul>
                </nav>
            </header>

            <main className="container">
                <div className={`menuSection ${menuOpen ? "active" : ""}`}>
                    <ul className="menuList">
                        <li className="menuItem" onClick={() => navigate("/my-games")}>
                            My Games
                        </li>
                        <li className="menuItem" onClick={() => navigate("/how-to-play")}>
                            How to Play
                        </li>
                        <li className="menuItem" onClick={() => handleToggle("game-history")}>
                            Game History
                            {openDropdown === "game-history" && (
                                <div className="dropdown">
                                    <p>View past game results.</p>
                                </div>
                            )}
                        </li>
                        <li className="menuItem" onClick={() => handleToggle("wallet")}>
                            Wallet
                            {openDropdown === "wallet" && (
                                <div className="dropdown">
                                    <p>Coming Soon: You will place bets with your opponent.</p>
                                </div>
                            )}
                        </li>
                    </ul>
                </div>

                <div className="contentContainer">
                    <div className="details">
                        <h2>Available Games</h2>
                        {games.length > 0 ? (
                            <ul className="gameList">
                                {games.map((game) => (
                                    <li key={game.id} className="gameItem">
                                        <span>Challenger: {game.challenger}</span>
                                        <span>Status: {game.status}</span>
                                        <button onClick={() => navigate(`/game/${game.id}`)}>Join</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>
                                No available games at the moment. <br />
                                <button onClick={createGame}>Create Game</button>
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;