import { Router } from 'express';
import CsvController from '../controllers/csvControllers';
import upload from '../middleware/upload';

const router = Router();

router.post('/upload', upload.single('file'), CsvController.uploadCsv);

router.get('/files', CsvController.getCsvFiles);

router.get('/files/:fileId/data', CsvController.getCsvData);

router.delete('files/:fileId', CsvController.deleteCsvFile);

export default router;