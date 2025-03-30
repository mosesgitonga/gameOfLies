import React from "react";
import "./styles/HowToPlay.css"; // Assuming you'll create this

const HowToPlay = () => {
    return (
        <div className="how-to-play-container">
            <h1>How to Play</h1>
            <div className="container">
                <section>
                    <h2>Game Rules & Instructions</h2>
                    <ol>
                        <li>The game is played on a <strong>3x3 board</strong> (like Tic-Tac-Toe).</li>
                        <li>There are <strong>two players</strong>, each with three pieces:</li>
                        <ul>
                            <li><strong>Player 1:</strong> "X"</li>
                            <li><strong>Player 2:</strong> "O"</li>
                        </ul>
                        <li>Players take turns placing pieces until all three are placed.</li>
                        <li>Once all pieces are placed, players can <strong>move their pieces</strong> to adjacent empty spaces.</li>
                        <li>5. The goal is to form a <strong>straight line</strong> (horizontal, vertical, or diagonal) to win.</li>
                    </ol>

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