import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import "./Celebration.css";

const jianWinResponses = [
  "You win? I am not unpleased. 😏",
  "You won!  could have done that using half of my brain.",
  "Ok, You won! This is not an uncommon occurrence",
  
  "Obviously, You are just lucky. Go and find a player who matches your skills",
  "You won. So You think you are smart? No. You just got lucky this time. 🤡",
  "I let you win. Don’t be happy too fast. 😂",
  "Okay, fine. You win. But don't get too cocky. 😒",
  "Fine, You won but I do not respect your skills.",
  "You won! Even a blind chicken could have done that.",
  "Congratulations. You’ve done something completely meaningless, yet here we are.",
];

const eazyWinResponses = [
  "Yo, respect. You handled your business. 🔥",
  "Wow, You did that. 💯",
  "Winning ain't just luck—it’s about making the right moves. Keep stacking those wins, but don’t get cocky.",
  "A win’s a win. But real players stay winning. Let’s see what you got next.",
  "Nice one. But don’t get too comfortable—every king’s gotta defend his throne.",
  "Clean win, no cap. You’re built for this. 💪",
  "Respect on the win. Now let’s see if you can run it back. 🎯",
  "You got the crown this time. Stay sharp, though—game don’t sleep. 👑",
  "This is the kind of moment that makes life beautiful. You played brilliantly.",
  "This is what happens when skill meets opportunity. Well done, my friend!"
];

const jianLoseResponses = [
  "You lose? Haha. I am not surprised. 😂",
  "You lose like a little baby. Go cry now. 😭",
  "So bad at this game. Maybe find a new hobby? 😆",
  "Oh no, you lose. So sad. Not really. 😜",
  "Even a monkey could play better than you. 🍌",
  "You lost. Now, go find a dark room and cry in a corner. ☠️",
  "You are a loser. Go practice with a teddy bear or something. 🧸",
  "Failure is just the universe reminding you of your limitations.",
  "Losing is not the worst thing. Thinking you deserved to win is.",
  "Defeat confirmed. Moving on.",
  "The result is final. You lost.",
  "Statistically, someone had to lose. It was you.",
  "Your loss has been recorded in the books of history.",
  "Future generations will learn from this failure.",
  "You lost, just like we expected.",
  "You lost. No hard feelings—actually, no feelings at all."
];

const eazyLoseResponses = [
  "You Lost. Life’s Cold Like That. ❄️",
  "See, this ain’t about luck—it’s about *moves*. And you? You made the wrong ones.",
  "You fumbled. But real ones get back up. What’s it gonna be?",
  "Losing ain't the end—it’s just a lesson. Now go study.",
  "It happens. But next time? Make sure it doesn’t.",
  "Loss hit you like that? Dust it off, player—next round’s yours to take.",
  "Down this time, but the game ain’t over. Bounce back, champ. ⏳",
  "You slipped. Happens to the best. What you gonna do about it? 🤔"
];

// Function to pick a response with warm ones having a higher chance
const getWeightedResponse = (warmResponses, coldResponses) => {
  const isWarm = Math.random() < 0.5; // 50% chance for warm response
  return isWarm
    ? warmResponses[Math.floor(Math.random() * warmResponses.length)]
    : coldResponses[Math.floor(Math.random() * coldResponses.length)];
};

const Celebration = ({ winner, playerSymbol, onClose }) => {
  const [show, setShow] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onClose();
    }, 15000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!show) return null;

  const isWinner = winner && winner === playerSymbol;

  // 60% chance for warm responses, 40% for cold responses
  const winResponse = getWeightedResponse(eazyWinResponses, jianWinResponses);
  const loseResponse = getWeightedResponse(eazyLoseResponses, jianLoseResponses);

  return (
    <div className="celebration-popup">
      {isWinner ? (
        <>
          <h2>{winResponse}</h2>
        </>
      ) : winner ? (
        <>
          <h2>{loseResponse}</h2>
        </>
      ) : (
        <>
          <h2>🤝 No Winner This Time! 🤝</h2>
          <p>It's a tie! Try again! 💪</p>
        </>
      )}
    </div>
  );
};

export default Celebration;
