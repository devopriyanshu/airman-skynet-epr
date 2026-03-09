import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import peopleRouter from './routes/people';
import eprRouter from './routes/epr';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-user-id'],
  })
);
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/people', peopleRouter);
app.use('/api/epr', eprRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Skynet EPR backend running at http://localhost:${PORT}`);
});

export default app;
