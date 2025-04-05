import express from 'express';
import { Server } from 'socket.io';
import https from 'https';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routesInjector from './routes/routesInjector.js';
import setupSocket from './services/socketHandler.js';

const FRONTEND_URL = 'https://vector-alpha-mocha.vercel.app';
const PORT = 443;
const SSL_KEY_PATH = '/etc/letsencrypt/live/loveefy.africa/privkey.pem';
const SSL_CERT_PATH = '/etc/letsencrypt/live/loveefy.africa/fullchain.pem';

const app = express();


app.use(cookieParser());
app.use(express.json());

// CORS setup (applies to all routes)
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// Fallback handler for any OPTIONS requests not caught earlier
app.options('*', (req, res) => res.sendStatus(204));

// === Load HTTPS certs safely ===
let sslOptions;
try {
  sslOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
  };
} catch (err) {
  console.error('Failed to read SSL certs:', err.message);
  process.exit(1);
}

const server = https.createServer(sslOptions, app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

io.engine.on('initial_headers', (headers) => {
  headers['Access-Control-Allow-Origin'] = FRONTEND_URL;
  headers['Access-Control-Allow-Credentials'] = 'true';
});

// Mount Routes and WebSocket Handler
routesInjector(app);
setupSocket(io);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

server.listen(PORT, () => {
  console.log(`✅ Server running securely on port ${PORT}`);
});
