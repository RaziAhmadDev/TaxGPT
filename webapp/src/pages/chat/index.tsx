import ChatComponent from "@/components/Chat";
import FileUpload from "@/components/FileUpload";
import { useState } from "react";

export default function Page() {
  const [index, setIndex] = useState("")
  return (
    <div className="flex h-screen">
      <FileUpload  setIndex={setIndex} />
      <ChatComponent index = {index}  />
    </div>
  );
}