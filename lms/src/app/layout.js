import "./globals.css";
import ChatWrapper from "./components/ChatWrapper";

export const metadata = {
  title: "Cloud LMS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ChatWrapper>{children}</ChatWrapper>
      </body>
    </html>
  );
}
