"use client";

import { usePathname } from "next/navigation";
import ChatPopup from "./ChatPopup";
import { ChatProvider } from "./ChatProvider";

export default function ChatWrapper({ children }) {
  const pathname = usePathname();

  const hideChat = pathname === "/";

  if (hideChat) {
    return children;
  }

  return (
    <ChatProvider>
      {children}
      <ChatPopup />
    </ChatProvider>
  );
}
