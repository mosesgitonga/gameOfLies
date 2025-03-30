import express from 'express';
import http from 'http';
import { Server } from "socket.io";
import cors from 'cors';
import routesInjector from './routes/routesInjector.js';
import authRouter from "./routes/authRoute.js";
import setupSocket from './services/socketHandler.js'

const app = express();

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(cors());

routesInjector(app);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

setupSocket(io);

server.listen(5000, () => console.log("Server running on port 5000"));
