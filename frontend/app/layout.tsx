import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/Footer";

const lineSeed = localFont({
  src: [
    {
      path: "./fonts/LINESeedSansTH_Th.ttf", // แก้เป็นนามสกุลจริงของคุณ
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/LINESeedSansTH_Rg.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/LINESeedSansTH_Bd.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/LINESeedSansTH_XBd.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/LINESeedSansTH_He.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-line-seed", // ชื่อตัวแปร CSS
});

export const metadata: Metadata = {
  title: "4Elements Team",
  description: "Team management app using DISC personality test",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lineSeed.className} min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 bg-slate-100 overflow-auto flex flex-col">
          <div className="flex-1 p-6">{children}</div>
          <div className="mt-auto">
            <Footer />
          </div>
        </main>
        <Toaster position="top-right" reverseOrder={false} />
      </body>
    </html>
  );
}
