import app from './app';
import { initDb } from './config/db';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await initDb();
    console.log('Database initialized successfully. About to start server...');

    const server = app.listen(PORT, () => {
      console.log(`✅ Server is now actually listening on port ${PORT}`);
    });

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