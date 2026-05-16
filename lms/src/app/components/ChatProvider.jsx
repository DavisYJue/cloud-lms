"use client";

import { createContext, useContext, useState } from "react";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  function clearHistory() {
    setMessages([]);
  }

  return (
    <ChatContext.Provider
      value={{ messages, setMessages, isOpen, setIsOpen, clearHistory }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
