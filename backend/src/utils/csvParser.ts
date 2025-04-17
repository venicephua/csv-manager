import fs from 'fs';
import Papa from 'papaparse';

interface CsvParseResult {
  columns: string[];
  rows: Record<string, any>[];
  errors: string[];
}

export default class CsvParser {
  static async parseFile(filePath: string): Promise<CsvParseResult> {
    return new Promise((resolve, reject) => {
      try {
        // Read file content
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const errors: string[] = [];
        
        // Parse the CSV file with proper types
        const parseResult = Papa.parse<Record<string, any>>(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        });
        
        // Extract rows and columns from results
        const rows = parseResult.data;
        const columns = parseResult.meta.fields || [];
        
        // Add any parsing errors
        if (parseResult.errors && parseResult.errors.length > 0) {
          parseResult.errors.forEach(error => {
            errors.push(`Line ${error.row}: ${error.message}`);
          });
        }
        
        // Basic validations
        if (columns.length === 0) {
          errors.push('CSV file has no columns');
        }
        
        if (rows.length === 0) {
          errors.push('CSV file contains no data');
        }
        
        // Check for duplicate headers
        const uniqueHeaders = new Set(columns);
        if (uniqueHeaders.size !== columns.length) {
          errors.push('CSV file contains duplicate column headers');
        }
        
        resolve({
          columns,
          rows,
          errors
        });
      } catch (error) {
        reject([`Error reading or parsing CSV file: ${error instanceof Error ? error.message : String(error)}`]);
      }
    });
  }
}