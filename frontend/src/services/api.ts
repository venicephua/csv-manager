import axios from "axios";

const API_URL = "http://localhost:3001/api/csv"; // Make sure to update this port to match your backend

export const uploadCSV = async (
  file: File,
  onUploadProgress: (progressEvent: any) => void
) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post(`${API_URL}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });
};

export const fetchLatestFileId = async (): Promise<number | null> => {
  try {
    const response = await axios.get(`${API_URL}/files`);
    return response.data.files[0].id;
  } catch (err) {
    console.error("Error fetching latest file ID:", err);
    return null;
  }
};

export const fetchCSVData = async (
  fileId: number | null,
  page = 1,
  limit = 10,
  searchTerm = ""
) => {
  try {
    if (!fileId) {
      console.error("fetchCSVData called with null fileId");
      throw new Error("No file ID provided");
    }

    console.log(
      `Fetching data for fileId: ${fileId}, page: ${page}, limit: ${limit}`
    );
    return axios.get(`${API_URL}/files/${fileId}/data`, {
      params: { page, limit, search: searchTerm },
    });
  } catch (err) {
    console.error("Error fetching CSV data:", err);
    throw err;
  }
};

export const deleteCSVFile = async (fileId: number): Promise<{ message: string, deletedFileId: number }> => {
    try {
        const response = await axios.delete(`${API_URL}/files/${fileId}`);
        return response.data;
    } catch (err) {
        console.error(`Error deleting file: ${fileId}`, err);
        throw new Error(`Failed to delete file: ${fileId}`);
    }
}
