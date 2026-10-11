import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorPilot AI - YouTube Research & Growth Engine",
  description:
    "AI-powered intelligence, research engine, and competitive tracking for creators and video strategists.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark antialiased">
      <body className="min-h-full flex flex-col bg-[#090a0f] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200 font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Toaster
          theme="dark"
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "#12141d",
              borderColor: "rgba(255, 255, 255, 0.12)",
              color: "#f3f4f6",
            },
          }}
        />
      </body>
    </html>
  );
}
