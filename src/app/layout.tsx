import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import TopBar from "@/components/TopBar";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Boligagent",
  description: "Overvåger rækkehuse til salg i Nyborg 5800",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Boligagent",
  },
  icons: { apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#e8358a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#141414] text-[#f5f5f5]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <TopBar />
        {children}
      </body>
    </html>
  );
}
