import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/csvRoutes';
import { initDb } from './config/db';

process.on('exit', (code) => {
  console.log(`Process exited with code ${code}`);
});

process.on('beforeExit', (code) => {
  console.log(`Process beforeExit with code ${code}`);
});


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/csv', router);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await initDb();
    console.log('Database initialized successfully. About to start server...');

    const server = app.listen(PORT, () => {
      console.log(`✅ Server is now actually listening on port ${PORT}`);
    });

    // Keep alive explicitly (optional)
    server.on('close', () => {
      console.log('Server closed');
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
    });

  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

startServer();

export default app;