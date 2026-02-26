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
  BookOpen,
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
        />
      ),
      content: (
        <div className="space-y-4 text-[var(--muted)]">
          <p className="text-sm sm:text-base">
            เราใช้โมเดลทางจิตวิทยา <b>Big Five (OCEAN)</b>{" "}
            ซึ่งเป็นมาตรฐานสากลที่ได้รับความเชื่อถือสูงสุดในการวิเคราะห์บุคลิกภาพ
            5 ด้าน:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="bg-purple-50 dark:bg-purple-900/10 p-2 sm:p-3 rounded-xl border border-purple-100/50 dark:border-purple-800/30">
              <span className="font-bold text-purple-600 dark:text-purple-400">
                🎨 Openness:
              </span>{" "}
              จินตนาการ, ความคิดสร้างสรรค์
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/10 p-2 sm:p-3 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
              <span className="font-bold text-blue-600 dark:text-blue-400">
                📏 Conscientiousness:
              </span>{" "}
              ระเบียบวินัย, ความรับผิดชอบ
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/10 p-2 sm:p-3 rounded-xl border border-orange-100/50 dark:border-orange-800/30">
              <span className="font-bold text-orange-600 dark:text-orange-400">
                🗣️ Extraversion:
              </span>{" "}
              การเข้าสังคม, พลังงาน
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 p-2 sm:p-3 rounded-xl border border-green-100/50 dark:border-green-800/30">
              <span className="font-bold text-green-600 dark:text-green-400">
                🤝 Agreeableness:
              </span>{" "}
              ความเป็นมิตร, การประนีประนอม
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 p-2 sm:p-3 rounded-xl border border-red-100/50 dark:border-red-800/30 sm:col-span-2">
              <span className="font-bold text-red-600 dark:text-red-400">
                🌪️ Neuroticism:
              </span>{" "}
              การตระหนักถึงความเสี่ยง, ความอ่อนไหวทางอารมณ์
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2. การคำนวณคะแนน (The Scoring)",
      icon: <Target size={32} />,
      content: (
        <div className="space-y-4 text-[var(--muted)]">
          <p className="text-sm sm:text-base">
            คะแนนถูกคำนวณจากชุดคำถามมาตรฐานสากล (IPIP)
            เพื่อหาค่าพลังของคุณในแต่ละด้าน:
          </p>
          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/10 font-mono text-[10px] min-[375px]:text-xs sm:text-sm">
            <div className="flex justify-between mb-2">
              <span>📈 High Score (&gt;60%)</span>
              <span className="text-green-600 dark:text-green-400 font-bold">
                บุคลิกภาพเด่นชัด
              </span>
            </div>
            <div className="flex justify-between border-t border-black/5 dark:border-white/10 pt-2">
              <span>📉 Low Score (&lt;40%)</span>
              <span className="text-[var(--muted)] font-bold">
                มีลักษณะตรงข้าม
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted)] italic opacity-80">
            *ไม่มีนิสัยที่ &quot;ดี&quot; หรือ &quot;แย่&quot;
            ทุกอย่างคือจุดเด่นที่คุณมี
          </p>
        </div>
      ),
    },
    {
      title: "3. อาชีพในเกม RPG (Gamification)",
      icon: <Scale size={32} />,
      content: (
        <div className="space-y-4 text-[var(--muted)]">
          <p>
            เราแปลงค่าพลัง OCEAN ให้เป็น <b>Class อาชีพ</b>{" "}
            เพื่อให้เห็นภาพการทำงานร่วมกัน:
          </p>
          <ul className="space-y-3 text-xs min-[375px]:text-sm ml-2 font-medium">
            <li className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center bg-black/5 dark:bg-white/5 rounded-lg py-1">🧙‍♂️</span>
              <div>
                <b className="text-[var(--foreground)] block">Mage (Openness)</b>
                <span className="opacity-70">นักสร้างสรรค์ไอเดีย รักการเรียนรู้สิ่งใหม่</span>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center bg-black/5 dark:bg-white/5 rounded-lg py-1">🛡️</span>
              <div>
                <b className="text-[var(--foreground)] block">Paladin (Conscientiousness)</b>
                <span className="opacity-70">ผู้คุมกฎจอมเป๊ะ มีระเบียบวินัยสูง</span>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center bg-black/5 dark:bg-white/5 rounded-lg py-1">⚔️</span>
              <div>
                <b className="text-[var(--foreground)] block">Warrior (Extraversion)</b>
                <span className="opacity-70">ขาลุยใจกล้า ชอบเข้าสังคมและนำทีม</span>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center bg-black/5 dark:bg-white/5 rounded-lg py-1">🌿</span>
              <div>
                <b className="text-[var(--foreground)] block">Cleric (Agreeableness)</b>
                <span className="opacity-70">สายซัพพอร์ต เน้นความประนีประนอม</span>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center bg-black/5 dark:bg-white/5 rounded-lg py-1">🗡️</span>
              <div>
                <b className="text-[var(--foreground)] block">Rogue (Neuroticism)</b>
                <span className="opacity-70">จอมวางแผน ระแวดระวังและรอบคอบ</span>
              </div>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "4. ความเข้ากันได้ (Compatibility)",
      icon: <Zap size={32} />,
      content: (
        <div className="space-y-4 text-[var(--muted)]">
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
        <BookOpen size={32} />
      ),
      content: (
        <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
          <p className="text-xs font-bold text-[var(--muted)] uppercase opacity-70 tracking-wider">
            Scientific Foundation
          </p>

          <div className="grid gap-4">
            <div className="relative pl-4 border-l-2 border-indigo-500/50">
              <h4 className="font-bold text-[var(--foreground)] text-sm sm:text-base">
                Barrick & Mount (1991)
              </h4>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed">
                พิสูจน์ว่า <span className="text-indigo-600 dark:text-indigo-400 font-medium">Conscientiousness (วินัย)</span> คือตัวทำนายความสำเร็จในการทำงานที่แม่นยำที่สุดในทุกอาชีพ
              </p>
            </div>

            <div className="relative pl-4 border-l-2 border-blue-500/50">
              <h4 className="font-bold text-[var(--foreground)] text-sm sm:text-base">
                Tett et al. (1991)
              </h4>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed">
                การเลือกคนที่นิสัยตรงกับงาน (Trait-Activation) แม่นยำและยั่งยืนกว่าการสุ่มรับคนทั่วไป
              </p>
            </div>

            <div className="relative pl-4 border-l-2 border-green-500/50">
              <h4 className="font-bold text-[var(--foreground)] text-sm sm:text-base">
                Peeters et al. (2006)
              </h4>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed">
                ทีมที่ <span className="text-green-600 dark:text-green-400 font-medium">Agreeableness (ความเข้ากันได้)</span> สูงและมีวินัยใกล้เคียงกัน จะทำงานได้ไหลลื่นที่สุด
              </p>
            </div>

            <div className="relative pl-4 border-l-2 border-rose-500/50">
              <h4 className="font-bold text-[var(--foreground)] text-sm sm:text-base">
                Satisfaction Study
              </h4>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed">
                คน Introvert จะมีความสุขน้อยลง หากต้องอยู่ในทีมที่ระดับพลังงาน (Extraversion) ต่างจากตนมากเกินไป
              </p>
            </div>

            <div className="relative pl-4 border-l-2 border-purple-500/50">
              <h4 className="font-bold text-[var(--foreground)] text-sm sm:text-base">
                Curşeu et al. (2019)
              </h4>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed">
                <span className="text-purple-600 dark:text-purple-400 font-medium">Too-Much-Of-A-Good-Thing:</span> นิสัยที่ดีหากมีมากเกินไป อาจส่งผลเสียต่อทีมได้ (เช่น มั่นใจเกินไปจนไม่ฟังใคร)
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[var(--background)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-black/5 dark:border-white/5 transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-2 text-[var(--foreground)] font-bold text-sm sm:text-base">
            <Info size={18} className="text-[var(--highlight)]" />
            <span>ระบบวิเคราะห์บุคลิกภาพ Kemii</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 min-[375px]:p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-full mb-4 animate-bounce-slow text-[var(--highlight)]">
              {slides[step].icon}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-2 leading-tight px-2">
              {slides[step].title}
            </h2>
          </div>
          <div className="text-left bg-[var(--background)] rounded-xl">
            {slides[step].content}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex justify-between items-center relative">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? "bg-[var(--highlight)] w-4"
                    : "bg-[var(--muted)]/30"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (step < slides.length - 1) setStep(step + 1);
              else onClose();
            }}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1 font-bold"
          >
            {step === slides.length - 1 ? (
              <span className="text-[var(--highlight)]">
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
