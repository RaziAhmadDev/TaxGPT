import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { MdFileUpload } from "react-icons/md";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const FileUpload = () => {
  const [file, setFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  function onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      setFile(URL.createObjectURL(file));
    }
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="w-1/2 h-screen flex justify-start items-center overflow-auto border-2 border-gray-300 bg-gray-50">
      {!file ? (
        <div className="mx-auto">
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <MdFileUpload className="w-8 h-8 mb-2" />
            <span className="text-lg text-gray-700">Select a file</span>
            <input
              type="file"
              className="hidden"
              onChange={onFileChange}
              accept=".pdf, image/*"
            />
          </label>
        </div>
      ) : (
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          className="w-full h-full"
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              renderTextLayer={false}
              width={window.innerWidth / 2}
              height={window.innerHeight / 2}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      )}
    </div>
  );
};

export default FileUpload;
