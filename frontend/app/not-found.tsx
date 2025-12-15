"use client";

import Link from "next/link";
import { Ghost, ArrowLeft, Home } from "lucide-react";
import ThemeBackground from "@/components/ThemeBackground"; // เรียกใช้ Background ตัวเทพที่เราทำไว้

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden font-sans text-slate-800 dark:text-slate-100">
      {/* เรียก Background เพื่อให้ Theme ต่อเนื่อง (มีมอนสเตอร์ตาแดงโผล่ถ้าเป็น Dark Mode) */}
      <ThemeBackground />

      <div className="relative z-10 max-w-md w-full">
        {/* 1. Animation Icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* วงเวทย์พื้นหลังหมุนๆ */}
          <div className="absolute inset-0 border-4 border-dashed border-slate-300 dark:border-slate-700 rounded-full animate-[spin_10s_linear_infinite]"></div>

          {/* ตัวละครหลัก: ผีน้อย (Ghost) ลอยไปมา */}
          <div className="absolute inset-0 flex items-center justify-center animate-[bounce_2s_infinite]">
            <Ghost size={64} className="text-slate-400 dark:text-slate-500" />
          </div>

          {/* เครื่องหมายตกใจ */}
          <div className="absolute top-0 right-0 bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-lg animate-ping">
            !
          </div>
          <div className="absolute top-0 right-0 bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-lg">
            ?
          </div>
        </div>

        {/* 2. Headline RPG Style */}
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-200 dark:to-slate-500 mb-2">
          404
        </h1>
        <h2 className="text-2xl font-bold text-slate-700 dark:text-white mb-4">
          Area Not Discovered
        </h2>

        {/* 3. Story Description */}
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm mb-8">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            ดูเหมือนท่านจะเดินหลงทางเข้ามาใน{" "}
            <span className="font-bold text-indigo-500">The Void</span>{" "}
            พื้นที่นี้ยังไม่ได้ถูกเขียนลงในแผนที่โลก หรือบางที...
            มันอาจจะถูกลบหายไปโดยเวทมนตร์โบราณ
          </p>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-center gap-4 text-xs font-mono text-slate-400 uppercase tracking-widest">
            <span>Danger Lv. ???</span>
            <span>•</span>
            <span>No Loot Here</span>
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="group relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <button className="relative w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95">
              <Home size={18} />
              Warp to Guild (Home)
            </button>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={18} />
            Retreat (Back)
          </button>
        </div>
      </div>
    </div>
  );
}
