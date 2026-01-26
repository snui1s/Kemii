import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import Providers from "@/components/Providers";
import ThemeBackground from "@/components/ThemeBackground";
import AuthGuard from "@/components/AuthGuard";

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
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kemii - Team Chemistry & Guild Assembly",
  description:
    "Build your dream team with Kemii. Analyze team chemistry, find your RPG class, and conquer the dungeon of work with data-driven insights.",
  icons: {
    icon: "/icon2.svg",
  },
  openGraph: {
    title: "Kemii - Team Chemistry & Guild Assembly",
    description:
      "Build your dream team with Kemii. Analyze team chemistry, find your RPG class, and conquer the dungeon of work with data-driven insights.",
    type: "website",
    locale: "en_US",
    siteName: "Kemii",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kemii - Team Chemistry & Guild Assembly",
    description:
      "Build your dream team with Kemii. Analyze team chemistry, find your RPG class, and conquer the dungeon of work with data-driven insights.",
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
              <AuthGuard>
                <div className="flex-1 p-6">{children}</div>
              </AuthGuard>
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
                  "!bg-[var(--background)]/95 " +
                  "!text-[var(--foreground)] " +
                  "!border !border-black/5 dark:!border-white/5 " +
                  "!shadow-2xl " +
                  "!rounded-xl " +
                  "backdrop-blur-xl",

                duration: 4000,

                success: {
                  iconTheme: {
                    primary: "var(--highlight)",
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
