"use client";
import { useState, useEffect } from "react";
import { Flame, Droplets, Wind, Mountain, FlaskConical } from "lucide-react";

export default function ElementalLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((oldValue) => {
        if (oldValue >= 99) return 99;
        // สุ่มการกระโดดของตัวเลขให้ดูเหมือนกำลังคำนวณจริง
        let jump = 0;
        if (oldValue < 30) jump = Math.random() * 2 + 1;
        else if (oldValue < 70) jump = Math.random() * 3;
        else jump = Math.random() * 0.5;

        return Math.min(oldValue + jump, 99);
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-12 animate-fade-in min-h-[400px]">
      {/* --- ส่วน Animation หลัก --- */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* 1. เส้นวงโคจร (Orbit Track) - ให้ดูเป็นวิทย์ */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700 animate-[spin_10s_linear_infinite]"></div>
        <div className="absolute inset-2 rounded-full border border-slate-100 dark:border-slate-800 opacity-50"></div>

        {/* 2. ธาตุหมุนวน (Electrons) */}
        {/* ใช้ animate-spin หมุนรอบตัวเอง */}
        <div className="absolute inset-0 animate-spin duration-3000 linear">
          {/* 🔥 ไฟ (บน) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 p-1.5 rounded-full border border-red-100 dark:border-red-900 shadow-sm shadow-red-500/20">
            <Flame
              size={20}
              className="text-red-500 animate-pulse"
              fill="currentColor"
            />
          </div>
          {/* 💧 น้ำ (ล่าง) */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 p-1.5 rounded-full border border-blue-100 dark:border-blue-900 shadow-sm shadow-blue-500/20">
            <Droplets
              size={20}
              className="text-blue-500 animate-pulse delay-75"
              fill="currentColor"
            />
          </div>
          {/* 💨 ลม (ซ้าย) */}
          <div className="absolute top-1/2 -left-3 -translate-y-1/2 bg-white dark:bg-slate-900 p-1.5 rounded-full border border-yellow-100 dark:border-yellow-900 shadow-sm shadow-yellow-500/20">
            <Wind
              size={20}
              className="text-yellow-500 animate-pulse delay-150"
              fill="currentColor"
            />
          </div>
          {/* ⛰️ ดิน (ขวา) */}
          <div className="absolute top-1/2 -right-3 -translate-y-1/2 bg-white dark:bg-slate-900 p-1.5 rounded-full border border-green-100 dark:border-green-900 shadow-sm shadow-green-500/20">
            <Mountain
              size={20}
              className="text-green-500 animate-pulse delay-200"
              fill="currentColor"
            />
          </div>
        </div>

        {/* 3. ตรงกลาง: หลอดทดลอง (Nucleus) */}
        <div className="relative z-10 flex items-center justify-center">
          {/* แสงเรืองหลังขวด */}
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>

          <div className="relative">
            <FlaskConical
              size={48}
              className="text-indigo-600 dark:text-indigo-400 drop-shadow-md"
              strokeWidth={1.5}
            />

            {/* ฟองอากาศลอยขึ้นจากขวด (Bubbles) */}
            <div className="absolute -top-4 right-0 w-2 h-2 bg-indigo-400 rounded-full animate-ping opacity-75 delay-300"></div>
            <div className="absolute -top-2 -right-2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping opacity-75 delay-700"></div>
          </div>
        </div>
      </div>

      {/* --- ส่วนข้อความ --- */}
      <div className="text-center space-y-3 w-full max-w-xs z-20">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 animate-pulse">
          กำลังคนสารเคมีให้ลงตัว...
        </h3>

        <div className="flex justify-between text-xs uppercase tracking-wider text-slate-400 font-bold">
          <span>Analysis</span>
          <span>{Math.floor(progress)}%</span>
        </div>

        {/* Progress Bar แบบหลอดทดลอง */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 relative">
          {/* แถบสีวิ่ง */}
          <div
            className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* ประกายวิบวับบนแถบ */}
            <div className="absolute top-0 right-0 bottom-0 w-full bg-white/20 animate-pulse"></div>
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 pt-2">
          AI is calculating your elemental chemistry
        </p>
      </div>
    </div>
  );
}
