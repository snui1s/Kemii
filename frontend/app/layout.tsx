import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import Providers from "@/components/Providers";
import ThemeBackground from "@/components/ThemeBackground";

const lineSeed = localFont({
  src: [
    {
      path: "./fonts/LINESeedSansTH_Th.ttf",
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
  variable: "--font-line-seed",
});

export const metadata: Metadata = {
  title: "Kemii",
  description: "Team Chemistry",
  icons: {
    icon: "/icon2.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${lineSeed.className} min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ThemeBackground />
            <Navbar />
            <main className="flex-1 dark:border-slate-700 overflow-auto flex flex-col relative z-0">
              <div className="flex-1 p-6">{children}</div>
              <div className="mt-auto">
                <Footer />
              </div>
            </main>
            <Toaster
              position="top-center"
              reverseOrder={false}
              toastOptions={{
                // ใช้ ! นำหน้าเพื่อบังคับทับ style เดิมของ library
                className:
                  "!bg-white dark:!bg-slate-800 " +
                  "!text-slate-900 dark:!text-slate-100 " +
                  "!border !border-slate-100 dark:!border-slate-700 " +
                  "!shadow-xl dark:!shadow-slate-900/50 " +
                  "!rounded-xl",

                duration: 4000,

                success: {
                  iconTheme: {
                    primary: "#10b981",
                    secondary: "white",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "white",
                  },
                },
              }}
            />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
