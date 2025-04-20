import pool from '../config/db'

export interface CsvFile {
    id?: number;
    filename: string;
    upload_date?: Date;
    row_count: number;
    columns: string[];
}

export interface CsvRow {
    id?: number;
    file_id: number;
    col_postId: number;
    col_id: number;
    col_name: string;
    col_email: string;
    col_body: string;
}

export default class CsvModel {
    static async createCsvFile(fileData: CsvFile): Promise<number> {
        const { filename, row_count, columns } = fileData;

        const result = await pool.query(
            'INSERT INTO csv_files (filename, row_count, columns) VALUES ($1, $2, $3) RETURNING id',
            [filename, row_count, JSON.stringify(columns)]
        );
        console.log('Data file inserted successfully into csv_files');

        return result.rows[0].id;
    }

    static async insertCsvRows(rows: CsvRow[]): Promise<void> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const insertPromises = rows.map(row => {
                return client.query(
                  'INSERT INTO posts (file_id, col_postId, col_id, col_name, col_email, col_body) VALUES ($1, $2, $3, $4, $5, $6)',
                  [row.file_id, row.col_postId, row.col_id, row.col_name, row.col_email, row.col_body]
                );
            });
            console.log('Data inserted successfully into posts');

            await Promise.all(insertPromises);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async getCsvFiles(page: number = 1, limit: number = 10): Promise<{ files: CsvFile[], total: number }> {
        const offset = (page - 1) * limit;
        const countResult = await pool.query('SELECT COUNT (*) FROM csv_files');
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            'SELECT * FROM csv_files ORDER BY upload_date DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        console.log('Data file fetched successfully from csv_files');

        return {
            files: result.rows,
            total
        }
    }

    static async getCsvData(
        fileId: number, 
        page: number = 1, 
        limit: number = 10,
        searchTerm: string = ''
    ): Promise<{ rows: CsvRow[], total: number }> {
        const offset = (page - 1) * limit;

        let queryParams: (number | string)[] = [fileId, limit, offset];
        let query = 'SELECT * FROM posts WHERE file_id = $1';
        let countQuery = 'SELECT COUNT(*) FROM posts WHERE file_id = $1';

        if (searchTerm && searchTerm.trim() !== '') {
            query += " AND (col_name ILIKE $4 OR col_email ILIKE $4 OR col_body ILIKE $4)";
            countQuery += " AND (col_name ILIKE $2 OR col_email ILIKE $2 OR col_body ILIKE $2)";
            queryParams.push(`%${searchTerm}%`);
        }

        query += ' LIMIT $2 OFFSET $3';

        const countParams = searchTerm ? [fileId, `%${searchTerm}%`] : [fileId];
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(query, queryParams);

        console.log('Data fetched successfully from posts');
        return {
            rows: result.rows,
            total
        }
    }

    static async getCsvColumns(fileId: number): Promise<string[]> {
        const result = await pool.query(
            'SELECT columns FROM csv_files WHERE id = $1',
            [fileId]
        );

        if (result.rows.length === 0) {
            throw new Error('CSV file not found');
        }
        console.log('Columns fetched successfully from data file');

        return result.rows[0].columns;
    }

    static async deleteCsvFile(fileId: number): Promise<boolean> {
        const result = await pool.query('DELETE FROM csv_files WHERE id = $1', [fileId]);

        console.log('Data file deleted successfully from csv_files');
        return (result.rowCount || 0) > 0;
    }
} 