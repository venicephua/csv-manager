import { Request, Response } from 'express';
import fs from 'fs';
import CsvModel, { CsvFile, CsvRow } from '../models/csvData';
import CsvParser from '../utils/csvParser';

export default class CsvController {
  static async uploadCsv(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const file = req.file;
    const filePath = file.path;

    try {
      const { columns, rows, errors } = await CsvParser.parseFile(filePath);

      if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
      }

      const fileId = await CsvModel.createCsvFile({
        filename: file.originalname,
        row_count: rows.length,
        columns,
      });

      const csvRows: CsvRow[] = rows.map((row, index) => ({
        file_id: fileId,
        col_postId: row.postId,
        col_id: row.id,
        col_name: row.name,
        col_email: row.email,
        col_body: row.body,
      }));

      await CsvModel.insertCsvRows(csvRows);

      res.status(201).json({
        message: 'CSV file uploaded and processed successfully',
        fileId,
        rowCount: rows.length,
        columns,
      });
      console.log('Received file:', file);
      // console.log('Parsed rows:', file);

    } catch (err) {
      res.status(400).json({
        error: 'Failed to parse or process CSV',
        details: Array.isArray(err) ? err : [String(err)],
      });
    } finally {
      CsvController.removeFileIfExists(filePath);
    }
  }

  static async getCsvFiles(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = CsvController.getPagination(req);

      const result = await CsvModel.getCsvFiles(page, limit);

      res.json({
        files: result.files,
        pagination: {
          total: result.total,
          page,
          limit,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      CsvController.handleServerError(res, 'retrieving CSV files', err);
    }
  }

  static async getCsvData(req: Request, res: Response): Promise<void> {
    try {
      const fileId = parseInt(req.params.fileId);
      const { page, limit } = CsvController.getPagination(req);
      const search = (req.query.search as string) || '';

      const columns = await CsvModel.getCsvColumns(fileId);
      const result = await CsvModel.getCsvData(fileId, page, limit, search);

      res.json({
        data: result.rows,
        columns,
        pagination: {
          total: result.total,
          page,
          limit,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (err) {
      CsvController.handleServerError(res, 'retrieving CSV data', err);
    }
  }

  static async deleteCsvFile(req: Request, res: Response): Promise<void> {
    try {
      const fileId = parseInt(req.params.fileId);
      const success = await CsvModel.deleteCsvFile(fileId);
      
      if (success) {
        res.status(200).json({ message: 'CSV file deleted successfully' });
        return;
      } else {
        res.status(404).json({ error: 'CSV file not found' });
        return;
      }
    } catch (err) {
      CsvController.handleServerError(res, 'deleting CSV file', err);
    }
  };

  private static getPagination(req: Request): { page: number; limit: number } {
    return {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };
  }

  private static removeFileIfExists(path: string) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  }

  private static handleServerError(res: Response, action: string, err: unknown): void {
    console.error(`Error ${action}:`, err);
    res.status(500).json({
      error: `Error ${action}`,
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
