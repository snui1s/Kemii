"use client";
import { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Info,
  BrainCircuit,
  Target,
  Scale,
  Zap,
  BookOpen, // ✅ เพิ่มไอคอนสมุดวิจัย
} from "lucide-react";

interface InfoModalProps {
  onClose: () => void;
}

export default function InfoModal({ onClose }: InfoModalProps) {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "1. ทฤษฎีเบื้องหลัง (The Science)",
      icon: (
        <BrainCircuit
          size={32}
          className="text-indigo-500 dark:text-indigo-400"
        />
      ),
      content: (
        <div className="space-y-4 text-slate-600 dark:text-slate-300">
          <p>
            เราใช้โมเดลทางจิตวิทยา <b>Big Five (OCEAN)</b>{" "}
            ซึ่งเป็นมาตรฐานสากลที่ได้รับความเชื่อถือสูงสุดในการวิเคราะห์บุคลิกภาพ
            5 ด้าน:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded border border-purple-100 dark:border-purple-800/50">
              <span className="font-bold text-purple-600 dark:text-purple-400">
                🎨 Openness:
              </span>{" "}
              จินตนาการ, ความคิดสร้างสรรค์
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800/50">
              <span className="font-bold text-blue-600 dark:text-blue-400">
                📏 Conscientiousness:
              </span>{" "}
              ระเบียบวินัย, ความรับผิดชอบ
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-100 dark:border-orange-800/50">
              <span className="font-bold text-orange-600 dark:text-orange-400">
                🗣️ Extraversion:
              </span>{" "}
              การเข้าสังคม, พลังงาน
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-100 dark:border-green-800/50">
              <span className="font-bold text-green-600 dark:text-green-400">
                🤝 Agreeableness:
              </span>{" "}
              ความเป็นมิตร, การประนีประนอม
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800/50 sm:col-span-2">
              <span className="font-bold text-red-600 dark:text-red-400">
                🌪️ Neuroticism:
              </span>{" "}
              ความอ่อนไหวทางอารมณ์, ความกังวล
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2. การคำนวณคะแนน (The Scoring)",
      icon: <Target size={32} className="text-red-500 dark:text-red-400" />,
      content: (
        <div className="space-y-4 text-slate-600 dark:text-slate-300">
          <p>
            คะแนนถูกคำนวณจากชุดคำถามมาตรฐานสากล (IPIP)
            เพื่อหาค่าพลังของคุณในแต่ละด้าน:
          </p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs md:text-sm">
            <div className="flex justify-between mb-2">
              <span>📈 High Score (&gt;60%)</span>
              <span className="text-green-600 dark:text-green-400 font-bold">
                บุคลิกภาพเด่นชัด
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>📉 Low Score (&lt;40%)</span>
              <span className="text-slate-500 dark:text-slate-400 font-bold">
                มีลักษณะตรงข้าม
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            *ไม่มีนิสัยที่ "ดี" หรือ "แย่" ทุกอย่างคือจุดเด่นที่คุณมี
          </p>
        </div>
      ),
    },
    {
      title: "3. อาชีพในเกม RPG (Gamification)",
      icon: <Scale size={32} className="text-green-500 dark:text-green-400" />,
      content: (
        <div className="space-y-4 text-slate-600 dark:text-slate-300">
          <p>
            เราแปลงค่าพลัง OCEAN ให้เป็น <b>Class อาชีพ</b>{" "}
            เพื่อให้เห็นภาพการทำงานร่วมกัน:
          </p>
          <ul className="grid grid-cols-2 gap-2 text-xs md:text-sm ml-2 font-medium">
            <li className="flex items-center gap-1">
              🧙‍♂️ Mage: สายครีเอทีฟ (สูง O)
            </li>
            <li className="flex items-center gap-1">
              🛡️ Paladin: สายเป๊ะ (สูง C)
            </li>
            <li className="flex items-center gap-1">
              ⚔️ Warrior: สายลุย (สูง E)
            </li>
            <li className="flex items-center gap-1">
              🌿 Cleric: สายซัพ (สูง A)
            </li>
            <li className="flex items-center gap-1">
              🗡️ Rogue: สายรอบคอบ (สูง N)
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "4. ความเข้ากันได้ (Compatibility)",
      icon: <Zap size={32} className="text-yellow-500 dark:text-yellow-400" />,
      content: (
        <div className="space-y-4 text-slate-600 dark:text-slate-300">
          <p>
            อัลกอริทึมจัดทีมของเราใช้หลักการ <b>Similarity</b> และ{" "}
            <b>Complementarity</b>:
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>
                <b>เน้นความคล้าย:</b> ด้านระเบียบวินัย (C) เพื่อลดความขัดแย้ง
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>
                <b>เน้นความต่าง:</b> กระจายความเป็นผู้นำ (E) ไม่ให้ทับไลน์กัน
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>
                <b>ต้องระวัง:</b> การรวมตัวของคนเครียดง่าย (N) มากเกินไป
              </span>
            </div>
          </div>
        </div>
      ),
    },
    // ✅ หน้า 5: งานวิจัยที่เพิ่มเข้ามา
    {
      title: "5. งานวิจัยอ้างอิง (Hall of Fame)",
      icon: (
        <BookOpen size={32} className="text-slate-700 dark:text-slate-300" />
      ),
      content: (
        <div className="space-y-3 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar">
          <p className="text-xs font-bold text-slate-500 uppercase">
            Scientific Foundation
          </p>

          <div className="space-y-4 text-xs">
            <div className="border-l-2 border-indigo-400 pl-3">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                Barrick & Mount (1991)
              </p>
              <p>
                พิสูจน์ว่า <b>Conscientiousness</b>{" "}
                คือตัวทำนายความสำเร็จในการทำงานที่แม่นยำที่สุดในทุกอาชีพ [cite:
                880, 881]
              </p>
            </div>

            <div className="border-l-2 border-blue-400 pl-3">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                Tett et al. (1991)
              </p>
              <p>
                ยืนยันว่าการล็อคเป้าหมายนิสัยให้ตรงกับงาน (Confirmatory)
                แม่นยำกว่าการสุ่มตรวจทั่วไป [cite: 998, 999]
              </p>
            </div>

            <div className="border-l-2 border-green-400 pl-3">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                Peeters et al. (2006)
              </p>
              <p>
                พบว่าทีมที่ <b>Agreeableness</b> และ <b>Conscientiousness</b>{" "}
                สูงและคล้ายกัน จะทำงานได้ดีที่สุด [cite: 491, 974, 975]
              </p>
            </div>

            <div className="border-l-2 border-rose-400 pl-3">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                Peeters (Satisfaction Study)
              </p>
              <p>
                คน <b>Introvert</b>{" "}
                จะพึงพอใจน้อยลงมากหากต้องอยู่ในทีมที่มีระดับการเข้าสังคมต่างจากตนมากไป
                [cite: 497, 801, 805]
              </p>
            </div>

            <div className="border-l-2 border-purple-400 pl-3 pb-2">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                Curşeu et al. (2019)
              </p>
              <p>
                เตือนเรื่อง <b>TMGT Effect</b>: นิสัยดีๆ
                หากมีสูงสุดโต่งเกินไปอาจส่งผลลบต่อการทำงานเป็นทีม
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-transparent dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
            <Info size={20} className="text-blue-500 dark:text-blue-400" />
            <span>ระบบวิเคราะห์บุคลิกภาพ Kemii</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4 animate-bounce-slow">
              {slides[step].icon}
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 leading-tight">
              {slides[step].title}
            </h2>
          </div>
          <div className="text-left bg-white dark:bg-slate-900 rounded-xl">
            {slides[step].content}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          <div className="flex gap-1.5 absolute left-1/2 -translate-x-1/2">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? "bg-blue-600 dark:bg-blue-500 w-4"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={() => {
              if (step < slides.length - 1) setStep(step + 1);
              else onClose();
            }}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-300 flex items-center gap-1 font-bold"
          >
            {step === slides.length - 1 ? (
              <span className="text-blue-600 dark:text-blue-400">
                เสร็จสิ้น
              </span>
            ) : (
              <ChevronRight size={24} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
