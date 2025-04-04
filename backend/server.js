import express from 'express';
import http from 'http';
import { Server } from "socket.io";
import cors from 'cors';
import routesInjector from './routes/routesInjector.js';
import authRouter from "./routes/authRoute.js";
import setupSocket from './services/socketHandler.js'
import cookieParser from 'cookie-parser';


const app = express();
app.use(cookieParser());
app.use(express.json()); 


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    },
});

app.use(
    cors({
        origin: "http://localhost:5173", 
        credentials: true, // Allow cookies
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
        allowedHeaders: ["Content-Type", "Authorization"], 
    })
);

app.use(express.urlencoded({ extended: true })); 
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// app.use(cors());

routesInjector(app);



setupSocket(io);

server.listen(5000, () => console.log("Server running on port 5000"));
