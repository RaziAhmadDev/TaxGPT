import ChatComponent from "@/components/Chat";
import FileUpload from "@/components/FileUpload";
import { useState } from "react";

export default function Home() {
  const [enableChat, setEnableChat] = useState(false);
  return (
    <div className="flex h-screen">
      <FileUpload setEnableChat={setEnableChat} />
      <ChatComponent disabled={!enableChat} />
    </div>
  );
}
