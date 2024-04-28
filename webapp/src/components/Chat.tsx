import React, { useState, FormEvent, ChangeEvent } from "react";
import { MdSend } from "react-icons/md";
import axios, { AxiosError } from "axios";

type Message = {
  text: string;
  sender: "user" | "ai";
};

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const constructChatHistory = (): string[] => {
    return messages.map((message) => message.text);
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newMessage.trim()) return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { text: newMessage, sender: "user" },
    ]);

    const payload = {
      query: newMessage,
      chat_history: constructChatHistory(),
    };

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/query`,
        payload,
      );
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: response.data.ai_response, sender: "ai" },
      ]);
    } catch (err) {
      const axiosError = err as AxiosError;
      setError(axiosError.message);
    } finally {
      setLoading(false);
      setNewMessage("");
    }
  };

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewMessage(event.target.value);
  };

  return (
    <div className="w-1/2 h-screen flex flex-col bg-gray-50 border-l">
      <div className="overflow-auto p-4 space-y-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`break-words p-2 rounded shadow ${
              message.sender === "user"
                ? "bg-white self-end"
                : "bg-gray-800 text-white self-start"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="mt-auto p-4 bg-white border-t">
        {error && <div className="text-red-500">{error}</div>}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            className="flex-grow p-2 border rounded"
            placeholder="Type your message..."
            value={newMessage}
            onChange={handleMessageChange}
            disabled={loading}
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
            disabled={loading}
          >
            {loading ? "Sending..." : <MdSend className="w-6 h-6" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;
