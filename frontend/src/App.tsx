import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import { fetchLatestFileId } from './services/api';
import './App.css';

const App: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Fetch the most recent file ID when component mounts
  useEffect(() => {
    const loadInitialFile = async () => {
      try {
        const latestFileId = await fetchLatestFileId();
        setUploadedFileId(latestFileId);
      } catch (error) {
        console.error("Error loading initial file:", error);
      } finally {
        setInitialLoadComplete(true);
      }
    };

    loadInitialFile();
  }, []);

  const handleUploadSuccess = (fileId: number) => {
    console.log(`File uploaded successfully with ID: ${fileId}`);
    setUploadedFileId(fileId);
    setRefreshTrigger(prev => prev + 1); // This forces DataTable to remount
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>CSV Data Manager</h1>
      </header>
      
      <main>
        <FileUpload onUploadSuccess={handleUploadSuccess} />
        {initialLoadComplete && (
          <DataTable 
            fileId={uploadedFileId} 
            key={`${uploadedFileId}-${refreshTrigger}`} // More precise key
          />
        )}
      </main>
      
      <footer>
        <p>CSV Data Processing Application</p>
      </footer>
    </div>
  );
};

export default App;