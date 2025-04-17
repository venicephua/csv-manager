import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'csv_manager',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test the connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully');
  }
});

// Function to initialize database tables
export const initDb = async (): Promise<void> => {
  try {
    // Create table for CSV metadata
    await pool.query(`
      CREATE TABLE IF NOT EXISTS csv_files (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        row_count INTEGER NOT NULL,
        columns JSONB NOT NULL
      )u
    `);

    // Create table for the actual CSV data
    // We'll store it as a JSONB column to handle dynamic fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS csv_data (
        id SERIAL PRIMARY KEY,
        file_id INTEGER REFERENCES csv_files(id) ON DELETE CASCADE,
        row_data JSONB NOT NULL,
        row_index INTEGER NOT NULL
      )
    `);

    // Create index for faster searching
    await pool.query(`
      CREATE INDEX IF NOT EXISTS csv_data_file_id_idx ON csv_data(file_id);
      CREATE INDEX IF NOT EXISTS csv_data_row_data_idx ON csv_data USING GIN(row_data);
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  }
};

export default pool;