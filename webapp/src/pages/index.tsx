import ChatComponent from "@/components/Chat";
import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <div className="flex h-screen">
      <FileUpload />
      <ChatComponent />
    </div>
  );
}
