import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/csvRoutes';

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

export default app;