import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'venice',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test the connection
// pool.query('SELECT NOW()', (err) => {
//   if (err) {
//     console.error('Database connection error:', err.stack);
//   } else {
//     console.log('Database connected successfully');
//   }
// });

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
      )
    `);

    // Create table for the actual CSV data (posts)
    // Store it in each column of the csv file
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        file_id INTEGER REFERENCES csv_files(id) ON DELETE CASCADE,
        col_postId INTEGER NOT NULL,
        col_id INTEGER NOT NULL,
        col_name TEXT NOT NULL, 
        col_email TEXT NOT NULL,
        col_body TEXT NOT NULL,
        row_index INTEGER NOT NULL
      )
    `);

    // Create index for faster searching
    await pool.query(`
      CREATE INDEX IF NOT EXISTS posts_file_id_idx ON posts(file_id);
      CREATE INDEX IF NOT EXISTS posts_col_postId_idx ON posts(col_postId);
      CREATE INDEX IF NOT EXISTS posts_col_id_idx ON posts(col_id);
      CREATE INDEX IF NOT EXISTS posts_col_name_idx ON posts(col_name);
      CREATE INDEX IF NOT EXISTS posts_col_email_idx ON posts(col_email);
      CREATE INDEX IF NOT EXISTS posts_col_body_idx ON posts(col_body);
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  }
};

export default pool;