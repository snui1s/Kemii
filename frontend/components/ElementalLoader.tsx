"use client";
import { useState, useEffect } from "react";
import {
  Wand, // Mage
  Shield, // Paladin
  Sword, // Warrior
  Heart, // Cleric
  Skull, // Rogue
  Compass, // เข็มทิศ
  Map, // แผนที่
  Footprints, // รอยเท้า
} from "lucide-react";

export default function ElementalLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((oldValue) => {
        if (oldValue >= 99) return 99;
        let jump = 0;
        if (oldValue < 30) jump = Math.random() * 2 + 1;
        else if (oldValue < 70) jump = Math.random() * 3;
        else jump = Math.random() * 0.5;
        return Math.min(oldValue + jump, 99);
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Animation สำหรับตัวละครเดิน (โยกซ้ายขวา)
  const walkBounce = "animate-[bounce_1s_infinite]";

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-10 animate-fade-in min-h-[400px] relative overflow-hidden">
      {/* 🌲 พื้นหลังป่า (Background Elements) */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute top-10 left-10 text-green-600">
          <Map size={40} />
        </div>
        <div className="absolute bottom-20 right-10 text-amber-600">
          <Footprints size={30} className="rotate-45" />
        </div>
        <div className="absolute top-1/2 left-1/4 text-green-800">
          <Map size={24} className="-rotate-12" />
        </div>
        {/* ต้นไม้จำลอง (ใช้ icon แทน) */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-green-100 to-transparent dark:from-green-900/30 z-0"></div>
      </div>

      {/* --- ส่วน Animation หลัก --- */}
      <div className="relative w-48 h-48 flex items-center justify-center z-10">
        {/* 1. ทางเดิน/แผนที่ (หมุนติ้วๆ) */}
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-200 dark:border-amber-800 animate-[spin_20s_linear_infinite] opacity-50"></div>
        <div className="absolute inset-4 rounded-full border border-amber-100 dark:border-amber-900 opacity-30"></div>

        {/* 2. แก๊งนักผจญภัย (เดินวนรอบ) */}
        {/* ใช้ animate-spin หมุนรอบตัวเอง เพื่อให้ตัวละครเดินเป็นวงกลม */}
        <div className="absolute inset-0 animate-spin duration-[10s] linear">
          {/* 🧙‍♂️ Mage (เดินนำ) */}
          <div
            className={`absolute -top-4 left-1/2 -translate-x-1/2 p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full shadow-md ${walkBounce}`}
          >
            <Wand
              size={24}
              className="text-purple-600 dark:text-purple-300"
              fill="currentColor"
            />
          </div>
          {/* ⚔️ Warrior (ขวา) */}
          <div
            className={`absolute top-1/2 -right-4 -translate-y-1/2 p-2 bg-red-100 dark:bg-red-900/50 rounded-full shadow-md ${walkBounce} delay-150`}
          >
            <Sword
              size={24}
              className="text-red-600 dark:text-red-300"
              fill="currentColor"
            />
          </div>
          {/* 🛡️ Paladin (ล่าง) */}
          <div
            className={`absolute -bottom-4 left-1/2 -translate-x-1/2 p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-full shadow-md ${walkBounce} delay-300`}
          >
            <Shield
              size={24}
              className="text-yellow-600 dark:text-yellow-300"
              fill="currentColor"
            />
          </div>
          {/* 🌿 Cleric (ซ้าย) */}
          <div
            className={`absolute top-1/2 -left-4 -translate-y-1/2 p-2 bg-green-100 dark:bg-green-900/50 rounded-full shadow-md ${walkBounce} delay-450`}
          >
            <Heart
              size={24}
              className="text-green-600 dark:text-green-300"
              fill="currentColor"
            />
          </div>
        </div>

        {/* 3. ตรงกลาง: เข็มทิศ (นำทาง) */}
        <div className="relative z-10 flex items-center justify-center bg-white dark:bg-slate-900 p-4 rounded-full border-4 border-indigo-100 dark:border-indigo-900 shadow-lg">
          {/* แสงเรือง */}
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
          <Compass
            size={48}
            className="text-indigo-600 dark:text-indigo-400 animate-[spin_3s_ease-in-out_infinite]"
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* --- ส่วนข้อความ --- */}
      <div className="text-center space-y-3 w-full max-w-xs z-20">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-green-600 dark:from-amber-400 dark:to-green-400 animate-pulse">
          กำลังออกเดินทางสู่ดันเจี้ยน...
        </h3>

        <div className="flex justify-between text-xs uppercase tracking-wider text-slate-500 font-bold">
          <span>Adventure Progress</span>
          <span>{Math.floor(progress)}%</span>
        </div>

        {/* Progress Bar แบบแถบผจญภัย */}
        <div className="w-full h-4 bg-amber-50 dark:bg-slate-800 rounded-full overflow-hidden border border-amber-200 dark:border-slate-700 relative">
          {/* แถบสีวิ่ง (ลายแผนที่) */}
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-green-500 transition-all duration-300 ease-out relative flex items-center justify-end px-1"
            style={{ width: `${progress}%` }}
          >
            {/* รอยเท้าเดินนำหน้า */}
            <Footprints
              size={12}
              className="text-white animate-pulse opacity-80"
            />
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 pt-2">
          Guild Master is calculating the best route.
        </p>
      </div>
    </div>
  );
}
