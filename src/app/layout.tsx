import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Boligagent",
  description: "Overvåger rækkehuse til salg i Nyborg 5800",
  manifest: "/manifest.json",
  themeColor: "#e8358a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Boligagent",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#141414] text-white">
        {children}
      </body>
    </html>
  );
}
