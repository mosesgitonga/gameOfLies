import { useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";

const base_url = import.meta.env.VITE_BASE_URL;

const CreateGame = ({ onGameCreated }) => {
    const { user } = useContext(AuthContext);
    const [entryFee, setEntryFee] = useState(0); // Changed from betAmount
    const [error, setError] = useState(null);

    const handleCreate = async (e) => {
        e.stopPropagation();
        console.log("Creating game with entryFee:", entryFee);
        if (entryFee <= 0) {
            setError("Please enter a valid entry fee");
            console.error("Invalid entry fee");
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("No access token found");
            const response = await fetch(`${base_url}/api/game`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ player1Id: user.id, betAmount: parseInt(entryFee) }), // Keep betAmount for backend compatibility
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create game");
            }

            const newGame = await response.json();
            console.log("Game creation successful:", newGame);
            onGameCreated(newGame);
        } catch (err) {
            console.error("Error creating game:", err);
            setError(err.message);
        }
    };

    const handleInputClick = (e) => {
        e.stopPropagation();
        console.log("Input clicked");
    };

    return (
        <div className="create-game" onClick={(e) => e.stopPropagation()}>
            <h3>Enter Tournament Entry Fee: </h3> {/* Changed from "Create New Game" */}
            <input
                type="number"
                step="1"
                value={entryFee}
                onChange={(e) => {
                    console.log("Entry fee changed to:", e.target.value);
                    setEntryFee(parseInt(e.target.value) || 0);
                }}
                onClick={handleInputClick}
                min="1"
                placeholder="Set entry fee"
            />
            <button onClick={handleCreate}>Create Tournament</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
};

export default CreateGame;