import React, { useEffect, useState, useCallback } from "react";
import { fetchLatestFileId, fetchCSVData } from "../services/api";

interface DataItem {
  [key: string]: any;
}

interface DataTableProps {
  fileId: number | null;
}

const DataTable: React.FC<DataTableProps> = ({fileId}) => {
  const [data, setData] = useState<DataItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const itemsPerPage = 10;

  const columnsToDisplay = ['col_postid', 'col_id', 'col_name', 'col_email', 'col_body'];
  const formatColumnName = (columnName: string): string => {
    return columnName.startsWith('col_') ? columnName.substring(4) : columnName;
  }

  useEffect(() => {
    console.log("DataTable received fileId:", fileId);
  }, [fileId]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      let currentFileId = fileId;
      if (!currentFileId) {
        currentFileId = await fetchLatestFileId();
        if (!currentFileId) {
          setError('No file selected. Please upload a CSV file first.');
          setData([]);
          setIsLoading(false);
          return;
        }
      }

      // Log to debug
      console.log(`Loading data for fileId: ${currentFileId}, page: ${currentPage}`);

      const response = await fetchCSVData(
        currentFileId,
        currentPage,
        itemsPerPage,
        activeSearchTerm
      );
      console.log("API Response for fileId", currentFileId, ":", response.data);
      console.table(response.data.data);

      if (response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          setData(response.data.data);

          if (response.data.pagination.total) {
            setTotalPages(Math.ceil(response.data.pagination.total / itemsPerPage));
          } else {
            setTotalPages(response.data.data.length >= 0 ? 1 : 0);
          }
        } else if (Array.isArray(response.data)) {
          // If the data is directly in the response
          setData(response.data);

          setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        } else {
          console.error("Unexpected data format:", response.data);
          setError("Received unexpected data format from server");
        }
      }
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fileId, currentPage, itemsPerPage, activeSearchTerm]);

  // useEffect for fileId changes
  useEffect(() => {
    console.log('DataTable fileId changed to: ', fileId);
    if (fileId != null) {
      loadData();
    }
  }, [fileId, loadData]);

  // useEffect for pagination
  useEffect(() => {
    if (fileId != null) {
      loadData();
    }
  }, [currentPage, loadData]);

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="data-table-container">
      <h2>CSV Data</h2>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {isLoading ? (
        <div className="loading">Loading data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : data.length === 0 ? (
        <div className="no-data">
          No data available. Please upload a CSV file.
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  {columnsToDisplay.map((column, index) => (
                    <th key={index}>{formatColumnName(column)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToDisplay.map((column, colIndex) => (
                      <td key={colIndex}>{item[column]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button onClick={handlePrevPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span className="page-number">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DataTable;
