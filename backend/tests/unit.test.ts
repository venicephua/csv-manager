import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../src/app';
import pool from '../src/config/db';
import CsvModel from '../src/models/csvData';

// Mock the database module
jest.mock('../src/models/csvData');

describe('CSV API Endpoints', () => {
  let testFilePath: string;
  const mockFileId = 1;
  const mockCsvData = [
    {
      id: 1,
      file_id: 1,
      col_postId: 1,
      col_id: 101,
      col_name: 'John Doe',
      col_email: 'john@example.com',
      col_body: 'This is a test comment'
    },
    {
      id: 2,
      file_id: 1,
      col_postId: 2,
      col_id: 102,
      col_name: 'Jane Smith',
      col_email: 'jane@example.com',
      col_body: 'Another test comment'
    }
  ];

  beforeAll(() => {
    // Create a test CSV file
    const csvContent = 'postId,id,name,email,body\n1,101,John Doe,john@example.com,This is a test comment\n2,102,Jane Smith,jane@example.com,Another test comment';
    testFilePath = path.join(__dirname, 'test.csv');
    fs.writeFileSync(testFilePath, csvContent);

    // Setup mock implementations
    (CsvModel.createCsvFile as jest.Mock).mockResolvedValue(mockFileId);
    (CsvModel.insertCsvRows as jest.Mock).mockResolvedValue(undefined);
    (CsvModel.getCsvFiles as jest.Mock).mockResolvedValue({
      files: [{ id: mockFileId, filename: 'test.csv', row_count: 2 }],
      total: 1
    });
    (CsvModel.getCsvData as jest.Mock).mockImplementation((fileId, page, limit, search) => {
      if (fileId === 9999) throw new Error('CSV file not found');
      
      const filtered = search 
        ? mockCsvData.filter(row => 
            row.col_name.includes(search) || 
            row.col_email.includes(search) || 
            row.col_body.includes(search))
        : mockCsvData;
      
      return {
        rows: filtered.slice((page - 1) * limit, page * limit),
        total: filtered.length
      };
    });
    (CsvModel.getCsvColumns as jest.Mock).mockResolvedValue(['postId', 'id', 'name', 'email', 'body']);
    (CsvModel.deleteCsvFile = jest.fn().mockImplementation((fileId) => {
      console.log('Mock deleteCsvFile called with fileId:', fileId);
      return Promise.resolve(fileId !== 9999);
    }));
  });

  afterAll(async () => {
    // Clean up test files
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
    // Close database connection
    await pool.end();
    
    // Add a small delay to allow connections to close
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('POST /api/csv/upload', () => {
    it('should upload a CSV file successfully', async () => {
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('file', testFilePath);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'CSV file uploaded and processed successfully',
        fileId: mockFileId,
        rowCount: 2,
        columns: ['postId', 'id', 'name', 'email', 'body']
      });
    });

    it('should reject non-CSV files', async () => {
      const textFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(textFilePath, 'Not a CSV');
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('file', textFilePath);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      
      fs.unlinkSync(textFilePath);
    });

    it('should reject empty CSV files', async () => {
      const emptyFilePath = path.join(__dirname, 'empty.csv');
      fs.writeFileSync(emptyFilePath, '');
      
      const response = await request(app)
        .post('/api/csv/upload')
        .attach('file', emptyFilePath);
      
      expect(response.status).toBe(400);
      
      fs.unlinkSync(emptyFilePath);
    });
  });

  describe('GET /api/csv/files', () => {
    it('should retrieve a list of CSV files', async () => {
      const response = await request(app).get('/api/csv/files');
      
      expect(response.status).toBe(200);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        pages: 1
      });
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app).get('/api/csv/files?page=1&limit=5');
      
      expect(response.status).toBe(200);
      expect(response.body.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 5,
        pages: 1
      });
    });
  });

  describe('GET /api/csv/files/:fileId/data', () => {
    it('should retrieve data from a specific CSV file', async () => {
      const response = await request(app).get(`/api/csv/files/${mockFileId}/data`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.columns).toEqual(['postId', 'id', 'name', 'email', 'body']);
    });

    it('should filter data with search parameter', async () => {
      const response = await request(app).get(`/api/csv/files/${mockFileId}/data?search=John`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].col_name).toContain('John');
    });

    it('should handle different search terms across columns', async () => {
      const emailResponse = await request(app).get(`/api/csv/files/${mockFileId}/data?search=jane@example`);
      expect(emailResponse.status).toBe(200);
      expect(emailResponse.body.data[0].col_email).toContain('jane@example');

      const bodyResponse = await request(app).get(`/api/csv/files/${mockFileId}/data?search=test comment`);
      expect(bodyResponse.status).toBe(200);
      expect(bodyResponse.body.data[0].col_body).toContain('test comment');
    });

    it('should handle non-existent file ID', async () => {
      const response = await request(app).get('/api/csv/files/9999/data');
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/csv/files/:fileId', () => {
    it('should delete a specific CSV file', async () => {
      const response1 = await request(app).delete(`/api/csv/files/${mockFileId}`);
      
      expect(response1.status).toBe(200);
      expect(response1.body).toEqual({
        message: 'CSV file deleted successfully'
      });
    });

    it('should handle non-existent file ID', async () => {
      const response = await request(app).delete('/api/csv/files/9999');
      expect(response.status).toBe(404);
    });
  });
});