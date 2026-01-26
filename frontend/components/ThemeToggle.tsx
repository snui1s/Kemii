"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0); // 0ms คือรอให้ Event Loop รอบนี้จบก่อน (เทคนิคแก้ขัด React)

    return () => clearTimeout(timer); // Cleanup กันเหนียว
  }, []);

  // ถ้ายังไม่ Mount (รันที่ Server หรือกำลังโหลด) ไม่ต้องโชว์อะไรเลย (กัน Icon กระพริบผิดอัน)
  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 opacity-50 animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-[var(--highlight)] group-hover:rotate-90 transition-transform duration-500" />
      ) : (
        <Moon className="w-5 h-5 text-[var(--foreground)] group-hover:-rotate-12 transition-transform duration-500" />
      )}
    </button>
  );
}
