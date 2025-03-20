import React, { useEffect, useState } from "react";
import "./Celebration.css"; 

const Celebration = ({ winner, onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onClose(); 
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!show) return null; 

  return (
    <div className="celebration-popup">
      {winner ? (
        <>
          <h2>🎉 Congratulations! Player {winner} Wins! 🎉</h2>
          <p>Great Job! 🎊🔥</p>
        </>
      ) : (
        <>
          <h2>😞 No Winner This Time! 😞</h2>
          <p>Try again! 💪</p>
        </>
      )}
    </div>
  );
};

export default Celebration;
