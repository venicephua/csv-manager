import React, { useState } from 'react';
import { uploadCSV } from '../services/api';

// Add this interface to define the component props
interface FileUploadProps {
  onUploadSuccess: (fileId: number) => void;
}

// Update the component to use the props interface
const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a CSV file first');
      return;
    }

    if (!selectedFile.name.endsWith('.csv')) {
      setErrorMessage('Please select a valid CSV file');
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      
      const response = await uploadCSV(selectedFile, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      console.log(response)
      const fileId = response.data.fileId;
      
      setUploadStatus('success');
      setSelectedFile(null);
      if (document.getElementById('file-input') as HTMLInputElement) {
        (document.getElementById('file-input') as HTMLInputElement).value = '';
      }
      
      // Call the onUploadSuccess callback to notify parent component
      onUploadSuccess(fileId);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage('Error uploading file. Please try again.');
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload CSV File</h2>
      <div className="file-input-container">
        <input
          id="file-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={uploadStatus === 'uploading'}
        />
        <button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploadStatus === 'uploading'}
        >
          Upload
        </button>
      </div>

      {uploadStatus === 'uploading' && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">{uploadProgress}% uploaded</div>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="success-message">File uploaded successfully!</div>
      )}

      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
    </div>
  );
};

export default FileUpload;