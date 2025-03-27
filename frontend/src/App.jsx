import React from "react";
import { Routes, Route } from "react-router-dom";
import GameBoard from "./board/GameBoard";
import Home from "./landing/Home";


const App = () => {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/game" element={<GameBoard />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </div>
  );
};

export default App;