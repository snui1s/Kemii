"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Info,
  Play,
  CheckCircle2,
  ChevronRight,
  Shield,
  Sword,
  Wand,
  Heart,
  Skull,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import ElementalLoader from "@/components/ElementalLoader";

// --- 1. ข้อมูลคำถาม OCEAN (10 ข้อ) ---
const questions = [
  {
    id: 1,
    trait: "Extraversion",
    text: "ฉันชอบเป็นจุดสนใจท่ามกลางผู้คน และเริ่มบทสนทนากับคนแปลกหน้าได้ง่าย",
  },
  {
    id: 2,
    trait: "Agreeableness",
    text: "ฉันมักจะเห็นอกเห็นใจ และชอบช่วยเหลือผู้อื่นเสมอ",
  },
  {
    id: 3,
    trait: "Conscientiousness",
    text: "ฉันทำงานอย่างเป็นระบบ มีระเบียบ และทำเสร็จทันเวลาเสมอ",
  },
  {
    id: 4,
    trait: "Neuroticism",
    text: "ฉันมักจะกังวล หรือเครียดง่าย เวลาเจอปัญหาที่ไม่คาดคิด",
  },
  {
    id: 5,
    trait: "Openness",
    text: "ฉันชอบจินตนาการ คิดไอเดียใหม่ๆ และเรียนรู้อะไรที่เป็นนามธรรม",
  },
  {
    id: 6,
    trait: "Extraversion",
    text: "ฉันรู้สึกมีพลังเมื่อได้ออกไปสังสรรค์ หรือทำกิจกรรมกลุ่ม",
  },
  {
    id: 7,
    trait: "Agreeableness",
    text: "ฉันหลีกเลี่ยงการขัดแย้ง และพยายามทำให้ทุกคนปรองดองกัน",
  },
  {
    id: 8,
    trait: "Conscientiousness",
    text: "ฉันใส่ใจรายละเอียดเล็กๆ น้อยๆ และตรวจสอบความถูกต้องเสมอ",
  },
  {
    id: 9,
    trait: "Neuroticism",
    text: "ฉันอารมณ์แปรปรวนได้ง่าย ขึ้นอยู่กับสถานการณ์รอบตัว",
  },
  {
    id: 10,
    trait: "Openness",
    text: "ฉันชอบศิลปะ ดนตรี หรือการแก้ปัญหาด้วยวิธีที่สร้างสรรค์",
  },
];

// Glowing Rune Rating Options
const ratingOptions = [
  {
    value: 1,
    label: "ไม่จริงเลย",
    glow: "shadow-red-500/50",
    ring: "ring-red-500",
    bg: "bg-red-500",
  },
  {
    value: 2,
    label: "ไม่ค่อยจริง",
    glow: "shadow-orange-500/50",
    ring: "ring-orange-500",
    bg: "bg-orange-500",
  },
  {
    value: 3,
    label: "เฉยๆ",
    glow: "shadow-slate-400/50",
    ring: "ring-slate-400",
    bg: "bg-slate-400",
  },
  {
    value: 4,
    label: "ค่อนข้างจริง",
    glow: "shadow-emerald-500/50",
    ring: "ring-emerald-500",
    bg: "bg-emerald-500",
  },
  {
    value: 5,
    label: "จริงที่สุด",
    glow: "shadow-emerald-400/50",
    ring: "ring-emerald-400",
    bg: "bg-emerald-400",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AssessmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded)
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <ElementalLoader />
      </div>
    );

  const handleSelect = (questionId: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  // --- DEBUG TOOL ---
  const handleDebugFill = (targetTrait: string, namePrefix: string) => {
    const newAnswers: Record<number, number> = {};
    questions.forEach((q) => {
      if (q.trait === targetTrait) {
        newAnswers[q.id] = 5;
      } else {
        newAnswers[q.id] = 1;
      }
    });
    setAnswers(newAnswers);
    if (!name) setName(`Test ${namePrefix}`);
    toast.success(`Debug: Filled for ${namePrefix} (${targetTrait})`);
  };

  const debugButtons = [
    {
      label: "Mage (O)",
      trait: "Openness",
      color: "text-purple-400 border-purple-500/50",
    },
    {
      label: "Paladin (C)",
      trait: "Conscientiousness",
      color: "text-yellow-400 border-yellow-500/50",
    },
    {
      label: "Warrior (E)",
      trait: "Extraversion",
      color: "text-red-400 border-red-500/50",
    },
    {
      label: "Cleric (A)",
      trait: "Agreeableness",
      color: "text-green-400 border-green-500/50",
    },
    {
      label: "Rogue (N)",
      trait: "Neuroticism",
      color: "text-blue-400 border-blue-500/50",
    },
  ];

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("กรุณากรอกชื่อเล่นก่อนนะครับ");
      return;
    }
    if (Object.keys(answers).length < questions.length) {
      toast.error("ตอบให้ครบทุกข้อก่อนนะ");
      return;
    }
    setIsSubmitting(true);

    const scores = {
      Openness: 0,
      Conscientiousness: 0,
      Extraversion: 0,
      Agreeableness: 0,
      Neuroticism: 0,
    };
    questions.forEach((q) => {
      const score = answers[q.id] || 0;
      // @ts-ignore
      if (scores[q.trait] !== undefined) {
        // @ts-ignore
        scores[q.trait] += score;
      }
    });

    const payload = {
      name: name,
      openness: scores.Openness,
      conscientiousness: scores.Conscientiousness,
      extraversion: scores.Extraversion,
      agreeableness: scores.Agreeableness,
      neuroticism: scores.Neuroticism,
    };

    try {
      const res = await axios.post(`${API_URL}/submit-assessment`, payload);
      const newUser = res.data;

      if (newUser.access_token) {
        localStorage.setItem("myToken", newUser.access_token);
        localStorage.setItem("myUserId", newUser.id.toString());
        localStorage.setItem("myName", newUser.name);
        localStorage.setItem("myClass", newUser.character_class);
        localStorage.setItem("myLevel", newUser.level.toString());
        window.dispatchEvent(new Event("user-updated"));
      }

      toast.success(`ปลุกพลังสำเร็จ! ยินดีต้อนรับคุณ ${newUser.name}`);
      router.push(`/assessment/result/${newUser.id}`);
    } catch (err) {
      console.error(err);
      toast.error("ระบบขัดข้อง! โปรดลองใหม่อีกครั้ง");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-200/20 dark:bg-purple-900/15 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-slate-200/30 dark:bg-slate-800/30 rounded-full blur-[80px]" />
      </div>

      {/* --- Tutorial Modal --- */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-3">
                <Sparkles size={12} /> AWAKENING RITUAL
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-wide">
                {tutorialStep === 1 ? "Class System" : "How to Play"}
              </h2>
              <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                {tutorialStep === 1
                  ? "ทำความรู้จักสายอาชีพของคุณ"
                  : "วิธีการทำแบบทดสอบ"}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              {tutorialStep === 1 ? (
                <div className="space-y-3">
                  {[
                    {
                      icon: Wand,
                      name: "Mage (นักเวทย์)",
                      desc: "จินตนาการสูง ชอบเรียนรู้",
                      color: "purple",
                    },
                    {
                      icon: Shield,
                      name: "Paladin (อัศวิน)",
                      desc: "ระเบียบวินัยสูง รับผิดชอบ",
                      color: "yellow",
                    },
                    {
                      icon: Sword,
                      name: "Warrior (นักรบ)",
                      desc: "พลังงานสูง ชอบลุย",
                      color: "red",
                    },
                    {
                      icon: Heart,
                      name: "Cleric (นักบวช)",
                      desc: "ใจดี ขี้สงสาร",
                      color: "green",
                    },
                    {
                      icon: Skull,
                      name: "Rogue (โจร)",
                      desc: "ไหวพริบดี ระวังตัว",
                      color: "blue",
                    },
                  ].map((cls) => (
                    <div
                      key={cls.name}
                      className={`flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-${cls.color}-500/50 transition-colors`}
                    >
                      <div
                        className={`p-2 rounded-lg bg-${cls.color}-500/20 text-${cls.color}-400`}
                      >
                        <cls.icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                          {cls.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {cls.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <p className="text-slate-600 dark:text-slate-400">
                    ให้คะแนนความเป็นตัวคุณ จาก 1 ถึง 5<br />
                    เลือก Spirit Orb ตามความจริง
                  </p>

                  {/* Demo Orbs */}
                  <div className="flex justify-center items-end gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-red-500 shadow-lg shadow-red-500/30" />
                      <span className="text-[10px] text-red-400">1</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 border-2 border-emerald-400 shadow-lg shadow-emerald-500/50" />
                      <span className="text-[10px] text-emerald-400">5</span>
                    </div>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20 text-sm text-indigo-700 dark:text-indigo-300">
                    💡 <b>Tip:</b> ตอบตามสัญชาตญาณแรก ไม่ต้องคิดนาน
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-0">
              {tutorialStep === 1 ? (
                <button
                  onClick={() => setTutorialStep(2)}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  ต่อไป <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={() => setShowGuide(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all"
                >
                  <Sparkles size={16} /> เริ่มพิธีปลุกพลัง
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Main Content --- */}
      <div className="max-w-2xl mx-auto py-10 px-4 relative z-10">
        {/* Debug Tools */}
        <div className="mb-6 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur">
          <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
            🚧 DEV DEBUG
          </p>
          <div className="flex flex-wrap gap-2">
            {debugButtons.map((btn) => (
              <button
                key={btn.label}
                onClick={() =>
                  handleDebugFill(btn.trait, btn.label.split(" ")[0])
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition ${btn.color}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4">
            <Sparkles size={12} /> SOUL AWAKENING
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-wide">
            พิธีปลุกพลัง
          </h1>
          <p className="text-slate-500">
            ตอบคำถาม 10 ข้อ เพื่อค้นหาอาชีพและสเตตัสที่แท้จริงของคุณ
          </p>
        </div>

        {/* Name Input Card */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-10 shadow-sm">
          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 tracking-wide">
            ชื่อเล่น
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="กรอกชื่อเล่นของคุณ..."
            className="w-full p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition"
          />
        </div>

        {/* Questions */}
        <div className="space-y-16">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Question Card */}
              <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 shadow-sm">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  Question {idx + 1}/10
                </span>
                <h3 className="text-lg sm:text-xl font-medium text-slate-800 dark:text-white mt-2 leading-relaxed text-center">
                  {q.text}
                </h3>
              </div>

              {/* Spirit Orbs - Glowing Runes */}
              <div className="flex items-center justify-center gap-3 sm:gap-6">
                {ratingOptions.map((opt) => {
                  const isSelected = answers[q.id] === opt.value;
                  const size = 32 + opt.value * 6; // 38, 44, 50, 56, 62
                  return (
                    <div
                      key={opt.value}
                      className="flex flex-col items-center gap-2 cursor-pointer group"
                      onClick={() => handleSelect(q.id, opt.value)}
                    >
                      <div
                        className={`
                          rounded-full transition-all duration-300 flex items-center justify-center
                          ${
                            isSelected
                              ? `${opt.bg} ring-2 ${opt.ring} shadow-lg ${opt.glow}`
                              : "bg-slate-100 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 group-hover:border-slate-400 dark:group-hover:border-slate-500"
                          }
                        `}
                        style={{ width: size, height: size }}
                      >
                        {isSelected && (
                          <CheckCircle2 className="text-white w-1/2 h-1/2" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold transition-all duration-300 ${
                          isSelected
                            ? "opacity-100 text-white"
                            : "opacity-0 group-hover:opacity-100 text-slate-500"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              {idx < questions.length - 1 && (
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-800 to-transparent mt-12" />
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-16 pb-20">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="animate-spin" size={20} />{" "}
                กำลังคำนวณค่าสเตตัส...
              </span>
            ) : (
              "ยืนยันการปลุกพลัง"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
