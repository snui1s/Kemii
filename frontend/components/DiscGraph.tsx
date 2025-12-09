"use client";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  Cell,
} from "recharts";

import { useState, useEffect } from "react";

interface DiscGraphProps {
  scores: { D: number; I: number; S: number; C: number };
}

export default function DiscGraph({ scores }: DiscGraphProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const x = scores.D + scores.I - (scores.S + scores.C);
  const y = scores.D + scores.S - (scores.I + scores.C);
  const data = [{ x, y }];
  const maxRange = 25;

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
        Loading Graph...
      </div>
    );
  }

  return (
    // ✅ ปรับ Container เป็น Dark Mode
    <div className="relative w-full h-[400px] bg-white dark:bg-slate-900 rounded-xl shadow-inner border border-slate-200 dark:border-slate-800 overflow-hidden font-sans transition-colors">
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {/* ซ้ายบน (หนู - S) */}
        <div className="bg-green-50/50 dark:bg-green-900/10 flex flex-col items-center justify-center p-4 border-r border-b border-slate-100 dark:border-slate-800 text-center transition-colors">
          <span className="text-4xl mb-2">🐁</span>
          <h3 className="font-bold text-green-700 dark:text-green-400">
            Steadiness
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ชอบทำงานเป็นทีม, ความสงบ, ช่วยเหลือ
          </p>
        </div>

        {/* ขวาบน (กระทิง - D) */}
        <div className="bg-red-50/50 dark:bg-red-900/10 flex flex-col items-center justify-center p-4 border-b border-slate-100 dark:border-slate-800 text-center transition-colors">
          <span className="text-4xl mb-2">🐂</span>
          <h3 className="font-bold text-red-700 dark:text-red-400">
            Dominance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ชอบทำงานท้าทาย, ตัดสินใจเร็ว, ชอบควบคุม
          </p>
        </div>

        {/* ซ้ายล่าง (หมี - C) */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 flex flex-col items-center justify-center p-4 border-r border-slate-100 dark:border-slate-800 text-center transition-colors">
          <span className="text-4xl mb-2">🐻</span>
          <h3 className="font-bold text-blue-700 dark:text-blue-400">
            Conscientiousness
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ชอบวิเคราะห์, ชอบความถูกต้อง, ชอบวางแผน
          </p>
        </div>

        {/* ขวาล่าง (อินทรี - I) */}
        <div className="bg-yellow-50/50 dark:bg-yellow-900/10 flex flex-col items-center justify-center p-4 text-center transition-colors">
          <span className="text-4xl mb-2">🦅</span>
          <h3 className="font-bold text-yellow-700 dark:text-yellow-400">
            Influence
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ชอบพูด, ชอบโน้มน้าว, สร้างแรงบันดาลใจ
          </p>
        </div>
      </div>

      {/* --- LAYER 2: ป้ายแกน (Axis Labels) --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* แกนตั้ง */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold bg-white dark:bg-slate-800 px-2 rounded shadow text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700">
          Group Centric
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold bg-white dark:bg-slate-800 px-2 rounded shadow text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700">
          Self Centric
        </div>

        {/* แกนนอน */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold bg-white dark:bg-slate-800 px-2 rounded shadow -rotate-90 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700">
          Introvert
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold bg-white dark:bg-slate-800 px-2 rounded shadow rotate-90 text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700">
          Extrovert
        </div>
      </div>

      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={300}
        minHeight={300}
        className="relative z-10"
      >
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis
            type="number"
            dataKey="x"
            hide
            domain={[-maxRange, maxRange]}
          />
          <YAxis
            type="number"
            dataKey="y"
            hide
            domain={[-maxRange, maxRange]}
          />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} content={() => null} />
          {/* ปรับสีเส้น Grid ให้จางลงในโหมดมืด */}
          <ReferenceLine
            x={0}
            stroke="#94a3b8"
            strokeOpacity={0.5}
            strokeDasharray="3 3"
          />
          <ReferenceLine
            y={0}
            stroke="#94a3b8"
            strokeOpacity={0.5}
            strokeDasharray="3 3"
          />
          <Scatter name="You" data={data} fill="#0f172a" opacity={0}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div
        className="absolute z-10 flex flex-col items-center justify-center w-6 h-6"
        style={{
          left: `${50 + (x / maxRange) * 50}%`,
          top: `${50 - (y / maxRange) * 50}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="absolute inline-flex h-full w-full rounded-full bg-slate-400 dark:bg-white opacity-75 animate-ping"></div>

        <div className="relative inline-flex w-6 h-6 rounded-full shadow-xl border-4 border-white/70 dark:border-slate-900/70 bg-slate-900/70 dark:bg-white/70 animate-pulse backdrop-blur-[2px]"></div>
      </div>
    </div>
  );
}
