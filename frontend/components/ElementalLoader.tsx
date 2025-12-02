"use client";
import { useState, useEffect } from "react";
import { Flame, Droplets, Wind, Mountain } from "lucide-react";

export default function ElementalLoader() {
  // 1. สร้าง State เก็บ % การโหลด (เริ่มที่ 0)
  const [progress, setProgress] = useState(0);

  // 2. ใช้ useEffect ทำตัวเลขวิ่งๆ จำลองการโหลด
  useEffect(() => {
    // ตั้งเวลาอัปเดตทุก 100ms (ถี่ขึ้นเพื่อให้ตัวเลขวิ่งเนียนๆ)
    const interval = setInterval(() => {
      setProgress((oldValue) => {
        // ถ้าถึง 99% แล้ว ให้ค้างไว้รอของจริงมา
        if (oldValue >= 99) return 99;

        let jump = 0;

        if (oldValue < 30) {
          jump = Math.random() * 1.5 + 1; // +1 ถึง +4%
        } else if (oldValue < 60) {
          jump = Math.random() * 3.5; // +0 ถึง +1.5%
        }
        // 🐢 ช่วงท้าย (60-85%): เริ่มคลาน
        else if (oldValue < 85) {
          jump = Math.random() * 2; // +0 ถึง +0.4%
        } else {
          jump = Math.random() * 0.5; // +0 ถึง +0.05% (น้อยมาก!)
        }
        // บวกค่าเพิ่ม แล้วปัดเศษไม่ให้เกิน 99
        return Math.min(oldValue + jump, 99);
      });
    }, 270);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-8 animate-fade-in">
      {/* วงแหวนธาตุหมุนวน (เหมือนเดิม) */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 animate-spin duration-3000 linear">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-100 p-2 rounded-full text-red-500 shadow-lg shadow-red-200">
            <Flame size={24} className="animate-pulse" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-100 p-2 rounded-full text-blue-500 shadow-lg shadow-blue-200">
            <Droplets size={24} className="animate-pulse delay-75" />
          </div>
          <div className="absolute top-1/2 -left-4 -translate-y-1/2 bg-yellow-100 p-2 rounded-full text-yellow-500 shadow-lg shadow-yellow-200">
            <Wind size={24} className="animate-pulse delay-150" />
          </div>
          <div className="absolute top-1/2 -right-4 -translate-y-1/2 bg-green-100 p-2 rounded-full text-green-500 shadow-lg shadow-green-200">
            <Mountain size={24} className="animate-pulse delay-200" />
          </div>
        </div>

        {/* ตรงกลาง */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-300 animate-bounce">
            <span className="text-xl">🔮</span>
          </div>
        </div>
      </div>

      {/* ข้อความ Loading + ตัวเลขที่วิ่งขึ้นเอง */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-slate-700 animate-pulse">
          กำลังหลอมรวมธาตุ...
        </h3>
        <p className="text-slate-500 text-sm font-mono">
          กำลังคำนวณความสมดุลของทีม {Math.floor(progress)}%
        </p>

        {/* (แถม) หลอด Loading เล็กๆ */}
        <div className="w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
