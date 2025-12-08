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
            เราใช้ทฤษฎีจิตวิทยา <b>DISC Assessment</b> ผสมผสานกับโมเดล{" "}
            <b>4 Elements (ธาตุทั้ง 4)</b>{" "}
            เพื่อวิเคราะห์สไตล์การทำงานและพฤติกรรมมนุษย์
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* 🔥 ไฟ */}
            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800/50">
              <span className="font-bold text-red-600 dark:text-red-400">
                🔥 ไฟ (D):
              </span>{" "}
              มุ่งมั่น, รวดเร็ว
            </div>
            {/* 💨 ลม */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-100 dark:border-yellow-800/50">
              <span className="font-bold text-yellow-600 dark:text-yellow-400">
                💨 ลม (I):
              </span>{" "}
              สร้างสรรค์, ช่างเจรจา
            </div>
            {/* ⛰️ ดิน */}
            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-100 dark:border-green-800/50">
              <span className="font-bold text-green-600 dark:text-green-400">
                ⛰️ ดิน (S):
              </span>{" "}
              มั่นคง, ใส่ใจคน
            </div>
            {/* 💧 น้ำ */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800/50">
              <span className="font-bold text-blue-600 dark:text-blue-400">
                💧 น้ำ (C):
              </span>{" "}
              ละเอียด, มีหลักการ
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2. สูตรคำนวณคะแนน (The Math)",
      icon: <Target size={32} className="text-red-500 dark:text-red-400" />,
      content: (
        <div className="space-y-4 text-slate-600 dark:text-slate-300">
          <p>
            คะแนนเกิดจากการคำนวณแบบ <b>Ipsative (Most - Least)</b>{" "}
            เพื่อตัดความลำเอียง (Bias) และค้นหาตัวตนที่แท้จริง
          </p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs md:text-sm">
            <div className="flex justify-between mb-2">
              <span>✅ เลือก มากที่สุด (Most)</span>
              <span className="text-green-600 dark:text-green-400 font-bold">
                +1 คะแนน
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>❌ เลือก น้อยที่สุด (Least)</span>
              <span className="text-red-500 dark:text-red-400 font-bold">
                -1 คะแนน
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            *คะแนนสุทธิจะถูกนำมาปรับฐาน (Normalize) เพื่อให้ค่าต่ำสุดเริ่มต้นที่
            0
          </p>
        </div>
      ),
    },
    {
      title: "3. กราฟความสมดุล (The Balance)",
      icon: <Scale size={32} className="text-green-500 dark:text-green-400" />,
      content: (
        <div className="space-y-4 text-slate-600 dark:text-slate-300">
          <p>
            ตำแหน่งจุดในกราฟ เกิดจาก <b>แรงดึงดูดระหว่างขั้วตรงข้าม</b> (Net
            Value)
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm ml-2">
            <li>
              แกนนอน: <b>Introvert</b> (น้ำ+ดิน) vs <b>Extrovert</b> (ไฟ+ลม)
            </li>
            <li>
              แกนตั้ง: <b>Task</b> (ไฟ+น้ำ) vs <b>People</b> (ลม+ดิน)
            </li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800/50">
            💡 <b>รู้หรือไม่?</b> หากคุณมีคะแนนสูงทั้งสองฝั่ง (เช่น ไฟสูง +
            น้ำสูง) แรงจะหักล้างกันจนจุดกลับมาอยู่ <b>ตรงกลาง</b>{" "}
            ซึ่งแสดงถึงความเป็นมนุษย์ที่ยืดหยุ่นสูง (Adapter)
          </div>
        </div>
      ),
    },
    {
      title: "4. ความเข้ากันได้ (Synergy)",
      icon: <Zap size={32} className="text-yellow-500 dark:text-yellow-400" />,
      content: (
        <div className="space-y-4 text-slate-600 dark:text-slate-300">
          <p>
            AI วิเคราะห์ความเข้ากันได้จาก <b>ส่วนเติมเต็ม</b> และ{" "}
            <b>ความขัดแย้ง</b> ของคะแนนดิบทั้ง 8 ค่า
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>
                <b>Score &gt; 80%:</b> คู่หูที่เติมเต็มจุดอ่อนให้กันและกัน
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span>
                <b>Score 60-80%:</b> เข้ากันได้ดี แต่อาจต้องจูนบางเรื่อง
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>
                <b>Score &lt; 60%:</b> มีความท้าทายสูง ต้องเปิดใจรับฟัง
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-transparent dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
            <Info size={20} className="text-blue-500 dark:text-blue-400" />
            <span>เกี่ยวกับระบบ 4Elements</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4 animate-bounce-slow">
              {slides[step].icon}
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              {slides[step].title}
            </h2>
          </div>
          <div className="text-left bg-white dark:bg-slate-900 rounded-xl">
            {slides[step].content}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          {/* Dots Indicator */}
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
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={() => {
              if (step < slides.length - 1) setStep(step + 1);
              else onClose(); // หน้าสุดท้ายกดแล้วปิดเลย
            }}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-300 flex items-center gap-1 font-medium"
          >
            {step === slides.length - 1 ? (
              <span className="text-blue-600 dark:text-blue-400">
                เข้าใจแล้ว
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
