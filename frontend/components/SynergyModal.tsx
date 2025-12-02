"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { X, Flame, Wind, Droplets, Mountain, Zap } from "lucide-react";

interface SynergyModalProps {
  myId: number;
  partnerId: number;
  onClose: () => void;
}

interface UserBase {
  id: number;
  name: string;
  animal: string;
  dominant_type: string;
}

interface AIAnalysis {
  synergy_score: number;
  synergy_name: string;
  element_visual: string;
  analysis: string;
  pro_tip: string;
}

interface SynergyData {
  user1: UserBase;
  user2: UserBase;
  ai_analysis: AIAnalysis;
}

export default function SynergyModal({
  myId,
  partnerId,
  onClose,
}: SynergyModalProps) {
  const [data, setData] = useState<SynergyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false; // 1. สร้างตัวแปรเช็คสถานะ

    const fetchSynergy = async () => {
      try {
        const res = await axios.post("http://localhost:8000/match-ai", {
          user1_id: myId,
          user2_id: partnerId,
        });

        // 2. เช็คก่อนเซ็ตค่า ว่าโดนยกเลิกไปหรือยัง
        if (!isCancelled) {
          setData(res.data);
          setLoading(false); // ย้าย setLoading มาในนี้ด้วย
        }
      } catch (error) {
        if (!isCancelled) {
          console.error(error);
          setLoading(false);
        }
      }
    };

    fetchSynergy();

    // 3. Cleanup Function: จะทำงานเมื่อ Component ถูกโหลดใหม่ (หรือยิงซ้ำ)
    return () => {
      isCancelled = true; // บอกว่า "รอบเก่า ยกเลิกนะ!"
    };
  }, [myId, partnerId]);

  // ฟังก์ชันเลือกไอคอนธาตุ
  const getElementIcon = (animal: string) => {
    if (animal.includes("กระทิง"))
      return <Flame size={40} className="text-red-500 animate-bounce" />;
    if (animal.includes("อินทรี"))
      return <Wind size={40} className="text-yellow-500 animate-bounce" />;
    if (animal.includes("หนู"))
      return <Mountain size={40} className="text-green-500 animate-bounce" />;
    return <Droplets size={40} className="text-blue-500 animate-bounce" />;
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative">
        {/* ปุ่มปิด */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 z-10 bg-white/50 rounded-full p-1"
        >
          <X size={24} />
        </button>

        {loading ? (
          // --- Loading State (ฉากวิเคราะห์เคมี) ---
          <div className="h-96 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50/50">
            {/* Background Effect (Optional: เพิ่มความฟุ้งๆ) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow mix-blend-multiply"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-400/20 rounded-full blur-3xl animate-pulse-slow animation-delay-1000 mix-blend-multiply"></div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center space-y-8 p-8 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm">
              {/* Icon & Text */}
              <div className="flex flex-col items-center gap-3">
                {/* ไอคอนขวดทดลองเด้งดึ๋ง */}
                <div className="text-6xl animate-bounce relative">
                  🧪
                  {/* ฟองอากาศลอยขึ้น */}
                  <span className="absolute -top-2 -right-2 text-2xl animate-ping opacity-75">
                    🫧
                  </span>
                </div>

                {/* ข้อความแบบ Gradient */}
                <div className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-purple-500 to-red-600">
                  กำลังวิเคราะห์เคมี...
                </div>
                <p className="text-slate-500 text-sm">
                  รอสักครู่ AI กำลังคำนวณความเข้ากันได้
                </p>
              </div>

              <div className="relative w-72 h-8 flex items-center justify-center">
                {/* ⚡ Custom Animation: สั่งให้สั่นกึกๆ (ใส่ไว้ตรงนี้เลยจะได้ไม่ต้องแก้ global css) */}
                <style jsx>{`
                  @keyframes energetic-shake {
                    0% {
                      transform: translate(-50%, -50%) translateX(0px)
                        rotate(0deg);
                    }
                    25% {
                      transform: translate(-50%, -50%) translateX(-2px)
                        rotate(-5deg);
                    }
                    50% {
                      transform: translate(-50%, -50%) translateX(2px)
                        rotate(3deg);
                    }
                    75% {
                      transform: translate(-50%, -50%) translateX(-1px)
                        rotate(-3deg);
                    }
                    100% {
                      transform: translate(-50%, -50%) translateX(0px)
                        rotate(0deg);
                    }
                  }
                  .animate-core-shake {
                    animation: energetic-shake 0.15s infinite linear; /* สั่นเร็วๆ ทุก 0.15วิ */
                  }
                `}</style>

                {/* รางวิ่ง (Track) */}
                <div className="absolute inset-0 top-2 bottom-2 bg-slate-200 rounded-full shadow-inner overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1s_infinite]"></div>
                </div>

                {/* 🌊 ธาตุน้ำ (ซ้าย) - อัดเข้ามา */}
                <div className="absolute left-0 h-2 top-3 w-[52%] bg-linear-to-r from-cyan-500 via-blue-500 to-white rounded-l-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>

                {/* 🔥 ธาตุไฟ (ขวา) - อัดเข้ามา */}
                <div className="absolute right-0 h-2 top-3 w-[52%] bg-linear-to-l from-yellow-500 via-red-500 to-white rounded-r-full animate-pulse animation-delay-75 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>

                {/* 💥 จุดปะทะตรงกลาง (The Core) - สั่นและระเบิดพลัง */}
                <div className="absolute top-1/2 left-1/2 w-12 h-12 z-20 flex items-center justify-center animate-core-shake">
                  {/* คลื่นพลังระเบิด (Shockwaves) - วงที่ 1 */}
                  <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-75"></div>

                  {/* คลื่นพลังระเบิด - วงที่ 2 (ดีเลย์หน่อย) */}
                  <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-50 animation-delay-300"></div>

                  {/* ตัวลูกแก้วหลัก (Core) */}
                  <div className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,1)] border-2 border-purple-200 z-30">
                    {/* ไอคอนหมุนติ้วๆ ข้างใน */}
                    <Zap
                      size={24}
                      className="text-purple-600 fill-purple-600 animate-spin duration-700"
                    />
                  </div>

                  {/* ประกายไฟแตกกระจาย (Particles) */}
                  <div className="absolute -top-4 -right-4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div className="absolute -bottom-3 -left-3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce animation-delay-500"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // --- Result State ---
          data && (
            <div>
              {/* Header: ชื่อท่าไม้ตาย & คะแนน */}
              <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
                {/* Background Element Effect */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-red-500 relative z-10">
                  {data.ai_analysis.synergy_name}
                </h2>

                <div className="flex items-center justify-center gap-2 mt-2 text-yellow-400">
                  <Zap fill="currentColor" />
                  <span className="text-xl font-bold">
                    Compatibility: {data.ai_analysis.synergy_score}%
                  </span>
                </div>
              </div>

              {/* Battle Arena (ซ้าย-ขวา) */}
              <div className="flex justify-between items-center p-6 bg-slate-50 border-b border-slate-100">
                {/* Me */}
                <div className="text-center w-1/3">
                  <div className="flex justify-center mb-2">
                    {getElementIcon(data.user1.animal)}
                  </div>
                  <h3 className="font-bold text-slate-800">
                    {data.user1.name}
                  </h3>
                  <span className="text-xs bg-white border px-2 py-1 rounded-full text-slate-500">
                    {data.user1.animal}
                  </span>
                </div>

                {/* VS */}
                <div className="text-2xl font-black text-slate-300 italic">
                  VS
                </div>

                {/* Partner */}
                <div className="text-center w-1/3">
                  <div className="flex justify-center mb-2">
                    {getElementIcon(data.user2.animal)}
                  </div>
                  <h3 className="font-bold text-slate-800">
                    {data.user2.name}
                  </h3>
                  <span className="text-xs bg-white border px-2 py-1 rounded-full text-slate-500">
                    {data.user2.animal}
                  </span>
                </div>
              </div>

              {/* Analysis Content */}
              <div className="p-8 space-y-6">
                <div>
                  <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                    🧐 วิเคราะห์เคมี
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {data.ai_analysis.analysis}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex gap-3 items-start">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="font-bold text-yellow-800 text-sm mb-1">
                      Pro Tip
                    </h4>
                    <p className="text-yellow-800/80 text-sm">
                      {data.ai_analysis.pro_tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
