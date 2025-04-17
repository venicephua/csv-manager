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
    row_data: Record<string, any>;
    row_index: number;
}

export default class CsvModel {
    static async createCsvFile(fileData: CsvFile): Promise<number> {
        const { filename, row_count, columns } = fileData;

        const result = await pool.query(
            'INSERT INTO csv_files (filename, row_count, columns) VALUES ($1, $2, $3) RETURNING id',
            [filename, row_count, JSON.stringify(columns)]
        );

        return result.rows[0].id;
    }

    static async insertCsvRows(rows: CsvRow[]): Promise<void> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const insertPromises = rows.map(row => {
                return client.query(
                  'INSERT INTO csv_data (file_id, row_data, row_index) VALUES ($1, $2, $3)',
                  [row.file_id, row.row_data, row.row_index]
                );
            });

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
        let query = 'SELECT * FROM csv_data WHERE file_id = $1';
        let countQuery = 'SELECT COUNT(*) FROM csv_data WHERE file_id = $1';

        if (searchTerm && searchTerm.trim() !== '') {
            query += " AND row_data::text ILIKE $4";
            countQuery += " AND row_data::text ILIKE $2";
            queryParams.push(`%${searchTerm}%`);
        }

        query += ' ORDER BY row_index LIMIT $2 OFFSET $3';

        const countParams = searchTerm ? [fileId, `%{searchTerm}%`] : [fileId];
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(query, queryParams);

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

        return result.rows[0].columns;
    }

    static async deleteCsvFile(fileId: number): Promise<void> {
        const result = await pool.query('DELETE FROM csv_files WHERE id = $1', [fileId]);
    }
} 