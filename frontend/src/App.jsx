import React from "react";
import { Routes, Route } from "react-router-dom";
import GameBoard from "./board/GameBoard";
import Home from "./landing/Home";
import Login from "./auth/Login";
import MyGames from "./landing/MyGames";
import HowToPlay from "./landing/HowToPlay";


const App = () => {
  return (
      <Routes>
        <Route path="/my-games" element={<MyGames />} />
        <Route path="/how-to-play" element={<HowToPlay />} />

        <Route path="/game/:id" element={<GameBoard />} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

      </Routes>
  );
};

export default App;