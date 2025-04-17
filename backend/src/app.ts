import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/csvRoutes';
import { initDb } from './config/db';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/csv', router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Initialize the database
initDb().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

export default app;