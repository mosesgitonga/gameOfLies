import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext"
import { useNavigate } from "react-router-dom";
import CreateGame from "../components/CreateGame";
import "./home.css";

const Home = () => {
    const [games, setGames] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const { isAuthenticated, user } = useContext(AuthContext);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [showCreateGame, setShowCreateGame] = useState(false);
    const [createdGame, setCreatedGame] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/games", {
                    headers: isAuthenticated ? { Authorization: `Bearer ${localStorage.getItem("access_token")}` } : {},
                });
                if (!response.ok) throw new Error("Failed to fetch games");
                const data = await response.json();
                setGames(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching games:", error);
                setGames([]);
            }
        };
        fetchGames();
    }, [isAuthenticated]);

    const handleToggle = (menu) => {
        console.log("Toggling menu:", menu);
        setOpenDropdown(openDropdown === menu ? null : menu);
        if (window.innerWidth <= 768) {
            setMenuOpen(false);
        }
    };

    const toggleMenu = () => {
        console.log("Toggling hamburger menu, current state:", menuOpen);
        setMenuOpen(!menuOpen);
        setOpenDropdown(null);
    };

    const handleGameCreated = (newGame) => {
        console.log("Game created:", newGame);
        setCreatedGame(newGame);
        setShowCreateGame(false);
        setOpenDropdown("create-game");
    };

    const copyShareLink = () => {
        if (!createdGame) return;
        const shareLink = `${window.location.origin}/game/${createdGame.gameId}`;
        navigator.clipboard.writeText(shareLink);
        alert("Tournament link copied to clipboard!");
    };

    const handleCreateGameClick = (e) => {
        e.stopPropagation();
        console.log("Create Game button clicked, showCreateGame:", showCreateGame);
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        setShowCreateGame(true);
        setOpenDropdown("create-game");
    };

    console.log("Rendering Home, showCreateGame:", showCreateGame, "openDropdown:", openDropdown);

    return (
        <div className="homeContainer">
            <header>
                <div className={`hamburger ${menuOpen ? "active" : ""}`} onClick={toggleMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <h1 id="heading">Vector</h1>
                <nav>
                    <ul className="nav-list">
                        <li onClick={() => navigate("/about")}>About</li>
                        {isAuthenticated ? (
                            <li>
                                <img
                                    src="/"
                                    alt={user?.username ? user.username : "profile"}
                                    className="profile-icon"
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
                        <li className="menuItem" onClick={() => navigate("/game-history")}>
                            Game History
                    
                        </li>
                        <li className="menuItem" onClick={() => navigate("/wallet")}>
                            Wallet
                        </li>
                        {isAuthenticated && (
                            <li className="menuItem" onClick={() => handleToggle("create-game")}>
                                Create Tournament. {/* Changed from "Create Game" */}
                                {openDropdown === "create-game" && (
                                    <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                                        {showCreateGame ? (
                                            <CreateGame onGameCreated={handleGameCreated} />
                                        ) : createdGame ? (
                                            <>
                                                <p>Tournament created! Share this link:</p>
                                                <p>{`${window.location.origin}/game/${createdGame.gameId}`}</p>
                                                <button onClick={copyShareLink}>Copy Link</button>
                                                <button onClick={() => navigate(`/game/${createdGame.gameId}`)}>
                                                    Go to Tournament
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={handleCreateGameClick}>Start New Tournament</button>
                                        )}
                                    </div>
                                )}
                            </li>
                        )}
                    </ul>
                </div>

                <div className="contentContainer">
                    <div className="details">
                        <h2>Available Tournaments</h2> {/* Changed from "Available Games" */}
                        {games.length > 0 ? (
                            <ul className="gameList">
                                {games.map((game) => (
                                    <li key={game.id} className="gameItem">
                                        <span>Creator: {game.challenger}</span>
                                        <span>Status: {game.status}</span>
                                        <span>Entry Fee: {game.entryAmount}</span> {/* Changed from "Bet Amount" */}
                                        <button onClick={() => navigate(`/game/${game.id}`)}>Join</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>
                                No available tournaments at the moment.{" "}
                                {isAuthenticated && (
                                    <button onClick={handleCreateGameClick}>Create Tournament</button>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;