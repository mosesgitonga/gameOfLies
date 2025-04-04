import React from "react";
import "./styles/HowToPlay.css";

const HowToPlay = () => {
    return (
        <div className="how-to-play-container">
            <h1>How to Play 3 Men's morris Tournaments</h1>
            <p>Welcome! Follow these steps to create, join, and win in our exciting 3 Men's Morris Tournaments.</p>

            <div className="container">
                {/* Step 1: Creating a Tournament */}
                <section className="step">
                    <h2>1. Create Your Tournament</h2>
                    <p>Set up your own 3 Mens's Morris Tournament:</p>
                    <ul>
                        <li>Log in to your account.</li>
                        <li>Navigate to the <strong>My Tournaments</strong> page.</li>
                        <li>Enter a <strong>tournament entry fee</strong> (e.g., KES 50) in the "Create Tournament" section.</li>
                        <li>Click <strong>Create Tournament</strong> to start your tournament.</li>
                    </ul>
                    <p className="note">Note: The entry fee is your stake – the winner takes the combined pot!</p>
                </section>

                {/* Step 2: Inviting Opponents */}
                <section className="step">
                    <h2>2. Invite an Opponent</h2>
                    <p>Bring a challenger into your tournament:</p>
                    <ul>
                        <li>After creating a tournament, you’ll get a <strong>unique tournament link</strong> (e.g., <code>{window.location.origin}/tournament/123</code>).</li>
                        <li>Click <strong>Copy Link</strong> to copy it.</li>
                        <li>Share the link with your opponent via chat, email, or any platform.</li>
                    </ul>
                    <p className="tip">Tip: You can cancel a pending tournament by clicking "Destroy" on the My Tournaments page.</p>
                </section>

                {/* Step 3: Joining a Tournament */}
                <section className="step">
                    <h2>3. Join a Tournament</h2>
                    <p>Got a tournament link? Here’s how to join:</p>
                    <ul>
                        <li>Log in (or sign up if you’re new).</li>
                        <li>Click the <strong>tournament link</strong> you received.</li>
                        <li>If it’s still pending and you have enough balance, you’ll enter the <strong>Tournament Room</strong>.</li>
                        <li>Pay the entry fee to secure your spot.</li>
                    </ul>
                    <p className="note">Note: Ensure your wallet has enough to cover the entry fee.</p>
                </section>

                {/* Step 4: The Prize */}
                <section className="step">
                    <h2>4. Win the Prize</h2>
                    <p>Here’s what you’re playing for:</p>
                    <ul>
                        <li>The <strong>winner</strong> claims the total entry fees from both players (e.g., KES 50 + KES 50 = KES 100).</li>
                        <li>The prize is credited to your wallet after the tournament ends.</li>
                    </ul>
                    <p className="tip">Tip: Outsmart your opponent to double your stake!</p>
                </section>

                {/* Step 5: Playing the Tournament */}
                <section className="step">
                    <h2>5. Play the Tournament</h2>
                    <p>Master the rules to win:</p>
                    <ul>
                        <li>The tournament uses a <strong>3x3 board</strong>.</li>
                        <li>Two players, each with three pieces:
                            <ul>
                                <li><strong>Player 1:</strong> <span className="x-piece">"X"</span></li>
                                <li><strong>Player 2:</strong> <span className="o-piece">"O"</span></li>
                            </ul>
                        </li>
                        <li><strong>Phase 1:</strong> Take turns placing your three pieces on empty squares.</li>
                        <li><strong>Phase 2:</strong> After placing all pieces, move one piece per turn to an adjacent empty square.</li>
                        <li><strong>Win:</strong> Form a straight line (horizontal, vertical, or diagonal) with your three pieces.</li>
                    </ul>
                    <p className="tip">Tips:
                        <ul>
                            <li>Control the center for flexibility.</li>
                            <li>Block your opponent’s potential line.</li>
                            <li>Force tough moves to gain the upper hand.</li>
                        </ul>
                    </p>
                </section>
            </div>
        </div>
    );
};

export default HowToPlay;