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

interface DiscGraphProps {
  scores: { D: number; I: number; S: number; C: number };
}

export default function DiscGraph({ scores }: DiscGraphProps) {
  // 1. คำนวณพิกัด X, Y
  // สมมติคะแนนเต็มด้านละ 24 (จากสูตร +12)
  // X: ขวา (D+I) - ซ้าย (S+C)
  const x = scores.D + scores.I - (scores.S + scores.C);

  // Y: บน (D+S) - ล่าง (I+C) *สูตรนี้อิงตามรูปที่คุณส่งมา
  const y = scores.D + scores.S - (scores.I + scores.C);

  const data = [{ x, y }];

  // กำหนดขอบเขตสูงสุดของกราฟ (เพื่อให้จุดอยู่ตรงกลางสวยๆ)
  const maxRange = 25;

  return (
    <div className="relative w-full h-[400px] bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden font-sans">
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {/* ซ้ายบน (หนู - S) */}
        <div className="bg-green-50/50 flex flex-col items-center justify-center p-4 border-r border-b border-slate-100 text-center">
          <span className="text-4xl mb-2">🐁</span>
          <h3 className="font-bold text-green-700">Steadiness</h3>
          <p className="text-xs text-slate-500">
            ชอบทำงานเป็นทีม, ความสงบ, ช่วยเหลือ
          </p>
        </div>

        {/* ขวาบน (กระทิง - D) */}
        <div className="bg-red-50/50 flex flex-col items-center justify-center p-4 border-b border-slate-100 text-center">
          <span className="text-4xl mb-2">🐂</span>
          <h3 className="font-bold text-red-700">Dominance</h3>
          <p className="text-xs text-slate-500">
            ชอบทำงานท้าทาย, ตัดสินใจเร็ว, ชอบควบคุม
          </p>
        </div>

        {/* ซ้ายล่าง (หมี - C) */}
        <div className="bg-blue-50/50 flex flex-col items-center justify-center p-4 border-r border-slate-100 text-center">
          <span className="text-4xl mb-2">🐻</span>
          <h3 className="font-bold text-blue-700">Conscientiousness</h3>
          <p className="text-xs text-slate-500">
            ชอบวิเคราะห์, ชอบความถูกต้อง, ชอบวางแผน
          </p>
        </div>

        {/* ขวาล่าง (อินทรี - I) */}
        <div className="bg-yellow-50/50 flex flex-col items-center justify-center p-4 text-center">
          <span className="text-4xl mb-2">🦅</span>
          <h3 className="font-bold text-yellow-700">Influence</h3>
          <p className="text-xs text-slate-500">
            ชอบพูด, ชอบโน้มน้าว, สร้างแรงบันดาลใจ
          </p>
        </div>
      </div>

      {/* --- LAYER 2: ป้ายแกน (Axis Labels) --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* แกนตั้ง */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold bg-white px-2 rounded shadow text-slate-600">
          Group Centric
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold bg-white px-2 rounded shadow text-slate-600">
          Self Centric
        </div>

        {/* แกนนอน */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold bg-white px-2 rounded shadow -rotate-90 text-slate-600">
          Introvert
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold bg-white px-2 rounded shadow rotate-90 text-slate-600">
          Extrovert
        </div>
      </div>

      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
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
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={() => null} />{" "}
            <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Scatter name="You" data={data} fill="#0f172a" opacity={0}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div
        className="absolute z-10 animate-bounce"
        style={{
          // คำนวณตำแหน่ง % บนหน้าจอ (Shift จากศูนย์กลาง 50%)
          left: `${50 + (x / maxRange) * 50}%`,
          top: `${50 - (y / maxRange) * 50}%`,
          // ใช้ translate เพื่อให้จุดกึ่งกลางของ div อยู่ตรงพิกัดพอดี
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="w-6 h-6 rounded-full shadow-xl border-4 border-white/70 bg-slate-900/70 animate-pulse"></div>

        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-sm animate-pulse">
          คุณอยู่นี่!
        </div>
      </div>
    </div>
  );
}
