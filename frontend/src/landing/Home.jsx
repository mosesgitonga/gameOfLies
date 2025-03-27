import React, { useEffect, useState } from "react";
import "./home.css";

const Home = () => {
    const [games, setGames] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Dummy state for now

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/games");
                const data = await response.json();
                setGames(data);
            } catch (error) {
                console.error("Error fetching games:", error);
            }
        };

        fetchGames();
    }, []);

    return (
        <div className="homeContainer">
            <header>
                <h1 id="heading">Game of Lies</h1>
                <nav>
                    <ul className="nav-list">
                        <li>About</li>
                        {isAuthenticated ? (
                            <li>
                                <img
                                    src="/profile-icon.png"
                                    alt="Profile"
                                    className="profile-icon"
                                />

                            </li>
                        ) : (
                            <>
                                <li>Login</li>
                                <li>Register</li>
                            </>
                        )}
                    </ul>
                </nav>
            </header>

            <main className="container">
                <div className="menuSection">
                    <ul className="menuList">
                        <li className="menuItem">My Games</li>
                        <li className="menuItem">How to play</li>
                        <li className="menuItem">Game History</li>
                        <li className="menuItem">Wallet</li>

                    </ul>
                </div>
                <div className="details">
                    <h2>Available Games</h2>
                    {games.length > 0 ? (
                        <ul className="gameList">
                            {games.map((game) => (
                                <li key={game.id} className="gameItem">
                                    <span>Challenger = {game.challenger}</span>
                                    <span>Status = {game.status}</span>
                                    <span></span>
                                    <button >Join</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No available games at the moment. <br />Create a new Game:  <button>Create Game</button></p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Home;