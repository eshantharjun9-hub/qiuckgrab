import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/ui";

export const metadata: Metadata = {
  title: "QuickGrab - AI-Powered Student Marketplace",
  description: "Real-time, AI-powered, verified student marketplace for campus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
