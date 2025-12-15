"use client";
import { useState, useEffect } from "react";
import {
  Wand, // Mage
  Shield, // Paladin
  Sword, // Warrior
  Heart, // Cleric
  Skull, // Rogue (✅ เพิ่ม Rogue)
  Compass,
  Map as MapIcon,
  Footprints,
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

  // ข้อมูล Class พร้อมตำแหน่งคำนวณล่วงหน้า (หลีกเลี่ยง hydration mismatch)
  // 5 heroes, 72° apart, radius=80px
  // Positions: sin/cos pre-calculated and rounded
  const heroes = [
    {
      icon: Wand,
      color: "text-purple-600 dark:text-purple-300",
      bg: "bg-purple-100 dark:bg-purple-900/50",
      x: 0,
      y: -80,
    }, // Mage (0°)
    {
      icon: Sword,
      color: "text-red-600 dark:text-red-300",
      bg: "bg-red-100 dark:bg-red-900/50",
      x: 76,
      y: -25,
    }, // Warrior (72°)
    {
      icon: Shield,
      color: "text-yellow-600 dark:text-yellow-300",
      bg: "bg-yellow-100 dark:bg-yellow-900/50",
      x: 47,
      y: 65,
    }, // Paladin (144°)
    {
      icon: Heart,
      color: "text-green-600 dark:text-green-300",
      bg: "bg-green-100 dark:bg-green-900/50",
      x: -47,
      y: 65,
    }, // Cleric (216°)
    {
      icon: Skull,
      color: "text-slate-600 dark:text-slate-300",
      bg: "bg-slate-100 dark:bg-slate-800",
      x: -76,
      y: -25,
    }, // Rogue (288°)
  ];

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-10 animate-fade-in min-h-[400px] relative overflow-hidden rounded-3xl">
      {/* 🗺️ Background: ลายแผนที่จางๆ (Clean Map Style) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* --- ส่วน Animation หลัก --- */}
      <div className="relative w-64 h-64 flex items-center justify-center z-10">
        {/* วงแหวนหมุนติ้วๆ */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 animate-[spin_20s_linear_infinite] opacity-50"></div>
        <div className="absolute inset-8 rounded-full border border-slate-200 dark:border-slate-800 opacity-30"></div>

        {/* 🌀 แก๊งนักผจญภัย (5 Class หมุนเป็นวงกลม) */}
        <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
          {heroes.map((hero, index) => (
            <div
              key={index}
              className={`absolute p-2.5 rounded-full shadow-lg border-2 border-white dark:border-slate-900 ${hero.bg}`}
              style={{
                left: `calc(50% + ${hero.x}px)`,
                top: `calc(50% + ${hero.y}px)`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* หมุน Icon กลับด้าน เพื่อให้หัวตั้งตรงตลอดเวลา */}
              <div className="animate-[spin_8s_linear_infinite_reverse]">
                <hero.icon
                  size={22}
                  className={hero.color}
                  fill="currentColor"
                  fillOpacity={0.2}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 🧭 ตรงกลาง: เข็มทิศ */}
        <div className="relative z-10 flex items-center justify-center bg-white dark:bg-slate-800 p-5 rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-xl">
          <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full animate-pulse"></div>
          <Compass
            size={48}
            className="text-indigo-500 dark:text-indigo-400 animate-[spin_3s_ease-in-out_infinite]"
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* --- ส่วนข้อความ --- */}
      <div className="text-center space-y-3 w-full max-w-xs z-20 relative">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 animate-pulse">
          กำลังรวบรวมปาร์ตี้...
        </h3>

        <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          <span>Loading Assets</span>
          <span>{Math.floor(progress)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[10px] text-slate-400 pt-1">
          Guild Master is analyzing soul signatures.
        </p>
      </div>
    </div>
  );
}
