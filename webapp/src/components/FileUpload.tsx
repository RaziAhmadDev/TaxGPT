import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { MdFileUpload } from "react-icons/md";
import axios, { AxiosError } from "axios";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

type DocumentLoadSuccess = {
  numPages: number;
};

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<Blob | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const uploadedFile = event.target.files[0];
      setLoading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", uploadedFile);

      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
        setFile(new Blob([uploadedFile], { type: uploadedFile.type }));
      } catch (err: any) {
        const axiosError = err;
        if (axiosError.response) {
          setError(
            axiosError?.response?.data?.error ||
              "An error occurred during upload.",
          );
        } else {
          setError("Error: " + axiosError.message);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: DocumentLoadSuccess) => {
    setNumPages(numPages);
  };

  return (
    <div className="w-1/2 h-screen flex justify-center items-center overflow-auto border-2 border-gray-300 bg-gray-50">
      {loading && <div className="text-center text-lg">Loading...</div>}
      {error && <div className="text-red-500 text-center text-lg">{error}</div>}
      {!file && !loading && !error && (
        <div className="flex flex-col items-center justify-center cursor-pointer">
          <label className="flex flex-col items-center justify-center">
            <MdFileUpload className="w-8 h-8 mb-2" />
            <span className="text-lg text-gray-700">Select a file</span>
            <input
              type="file"
              className="hidden"
              onChange={onFileChange}
              accept="application/pdf"
            />
          </label>
        </div>
      )}
      {file && (
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          className="w-full h-auto"
        >
          {numPages &&
            Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={window.innerWidth / 2}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            ))}
        </Document>
      )}
    </div>
  );
};

export default FileUpload;
