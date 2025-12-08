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
      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 opacity-50 animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
      aria-label="Toggle Theme"
    >
      {/* ใช้ Logic ง่ายๆ เช็คว่าถ้าเป็น dark ให้โชว์พระอาทิตย์ (ไว้กดกลับ) */}
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600 group-hover:-rotate-12 transition-transform duration-500" />
      )}
    </button>
  );
}
