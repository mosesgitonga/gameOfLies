import express from 'express';
import { Server } from 'socket.io';
import https from 'https';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routesInjector from './routes/routesInjector.js';
import setupSocket from './services/socketHandler.js';

// Configuration constants
const FRONTEND_URL = 'https://vector-alpha-mocha.vercel.app';
const PORT = 443;
const SSL_KEY_PATH = '/etc/letsencrypt/live/loveefy.africa/privkey.pem';
const SSL_CERT_PATH = '/etc/letsencrypt/live/loveefy.africa/fullchain.pem';

const app = express();
app.use(cookieParser());
app.use(express.json());

const options = {
  key: fs.readFileSync(SSL_KEY_PATH),
  cert: fs.readFileSync(SSL_CERT_PATH),
};

const server = https.createServer(options, app);

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

app.options('*', cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

routesInjector(app);

setupSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on HTTPS port ${PORT}`);
});