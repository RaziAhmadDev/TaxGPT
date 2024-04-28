import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { MdFileUpload } from "react-icons/md";
import axios from "axios";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const FileUpload = () => {
  const [file, setFile] = useState<any>(null);
  const [numPages, setNumPages] = useState<any>(null);
  const [loading, setLoading] = useState<any>(false);
  const [error, setError] = useState("");

  async function onFileChange(event: any) {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setLoading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", uploadedFile);

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        setFile(URL.createObjectURL(uploadedFile));
      } catch (err: any) {
        if (err.response) {
          setError(
            err.response.data.error || "An error occurred during upload.",
          );
        } else if (err.request) {
          setError("No response was received.");
        } else {
          setError("Error: " + err.message);
        }
      } finally {
        setLoading(false);
      }
    }
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

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
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={window.innerWidth / 2}
              height={window.innerHeight / 2}
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
