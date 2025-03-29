import React from "react";
import "./styles/HowToPlay.css"; // Assuming you'll create this

const HowToPlay = () => {
    return (
        <div className="how-to-play-container">
            <h1>How to Play</h1>
            <div className="container">
                <section>
                    <h2>Game Rules & Instructions</h2>
                    <p>1. The game is played on a <strong>3x3 board</strong> (like Tic-Tac-Toe).</p>
                    <p>2. There are <strong>two players</strong>, each with three pieces:</p>
                    <ul>
                        <li><strong>Player 1:</strong> "X"</li>
                        <li><strong>Player 2:</strong> "O"</li>
                    </ul>
                    <p>3. Players take turns placing pieces until all three are placed.</p>
                    <p>4. Once all pieces are placed, players can <strong>move their pieces</strong> to adjacent empty spaces.</p>
                    <p>5. The goal is to form a <strong>straight line</strong> (horizontal, vertical, or diagonal) to win.</p>
                </section>
                <section>
                    <h2>Tips and Tricks</h2>
                    <p>Block your opponent if they are about to win.</p>
                    <p>Control the center – it gives you more move options.</p>
                    <p>Force your opponent into a bad position by limiting their moves.</p>
                </section>
            </div>

        </div>
    );
};

export default HowToPlay;