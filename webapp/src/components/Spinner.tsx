// Spinner.tsx
import React from "react";

interface SpinnerProps {
  message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  return (
    <div className="flex justify-center items-center space-x-2">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      {message && <span className="text-lg text-gray-700">{message}</span>}
    </div>
  );
};

export default Spinner;
