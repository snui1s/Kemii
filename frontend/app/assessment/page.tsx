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
} from "lucide-react";
import toast from "react-hot-toast";
import ElementalLoader from "@/components/ElementalLoader";

// --- 1. ข้อมูลคำถาม OCEAN (10 ข้อ) ---
// Trait: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
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

// ตัวเลือกคะแนน 1-5
const ratingOptions = [
  { value: 1, label: "ไม่จริงเลย", color: "bg-red-500", size: "w-8 h-8" },
  { value: 2, label: "ไม่ค่อยจริง", color: "bg-orange-400", size: "w-10 h-10" },
  { value: 3, label: "เฉยๆ", color: "bg-gray-400", size: "w-12 h-12" },
  { value: 4, label: "ค่อนข้างจริง", color: "bg-green-400", size: "w-14 h-14" },
  { value: 5, label: "จริงที่สุด", color: "bg-green-600", size: "w-16 h-16" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AssessmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);

  // State เก็บคำตอบ: { questionId: score (1-5) }
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded)
    return (
      <div className="h-screen flex items-center justify-center">
        <ElementalLoader />
      </div>
    );

  // ฟังก์ชันเลือกคะแนน
  const handleSelect = (questionId: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  // --- DEBUG TOOL ---
  const handleDebugFill = (targetTrait: string, namePrefix: string) => {
    const newAnswers: Record<number, number> = {};
    questions.forEach((q) => {
      // ถ้าเป็น trait ที่ต้องการ ให้ 5 เต็ม
      // ถ้าไม่ใช่ ให้ 1 (หรือ 2-3 แล้วแต่ความ extreme แต่ user ขอ Pure ก็เอา 1 เลยชัดดี)
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
      color: "bg-purple-100 text-purple-700 border-purple-300",
    },
    {
      label: "Paladin (C)",
      trait: "Conscientiousness",
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    },
    {
      label: "Warrior (E)",
      trait: "Extraversion",
      color: "bg-red-100 text-red-700 border-red-300",
    },
    {
      label: "Cleric (A)",
      trait: "Agreeableness",
      color: "bg-green-100 text-green-700 border-green-300",
    },
    {
      label: "Rogue (N)",
      trait: "Neuroticism",
      color: "bg-slate-200 text-slate-700 border-slate-300",
    },
  ];
  // ------------------

  // ฟังก์ชันคำนวณคะแนนรวมแล้วส่งไป Backend
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("กรุณากรอกชื่อเล่นก่อนนะครับ ");
      return;
    }

    if (Object.keys(answers).length < questions.length) {
      toast.error("ตอบให้ครบทุกข้อก่อนนะ");
      return;
    }

    setIsSubmitting(true);

    // 1. รวมคะแนนแยกตาม Trait
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

    // 2. เตรียม Payload ส่งให้ Backend (ตาม Schema ใหม่)
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

      // Save Token & Data
      if (newUser.access_token) {
        localStorage.setItem("myToken", newUser.access_token);
        localStorage.setItem("myUserId", newUser.id.toString());
        localStorage.setItem("myName", newUser.name);
        localStorage.setItem("myClass", newUser.character_class);
        localStorage.setItem("myLevel", newUser.level.toString());

        // Dispatch Event ให้ Navbar อัปเดต
        window.dispatchEvent(new Event("user-updated"));
      }

      toast.success(`ปลุกพลังสำเร็จ! ยินดีต้อนรับคุณ ${newUser.name}`);
      // เปลี่ยนหน้าไป Dashboard (หน้าหลัก) แทนหน้า Result เดิม
      router.push(`/assessment/result/${newUser.id}`);
    } catch (err) {
      console.error(err);
      toast.error("ระบบขัดข้อง! โปรดลองใหม่อีกครั้ง");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 min-h-screen">
      {/* --- Tutorial Modal --- */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800 text-center shrink-0">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                {tutorialStep === 1 ? "Class System" : "How to Play"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {tutorialStep === 1
                  ? "ทำความรู้จักสายอาชีพของคุณ"
                  : "วิธีการทำแบบทดสอบ"}
              </p>
            </div>

            <div className="p-6 overflow-y-auto">
              {tutorialStep === 1 ? (
                // Step 1: แนะนำ Class
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
                    <div className="p-2 bg-purple-100 dark:bg-purple-800 text-purple-600 rounded-lg">
                      <Wand size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900 dark:text-purple-200">
                        Mage (นักเวทย์)
                      </h4>
                      <p className="text-xs opacity-70 text-slate-500 dark:text-slate-400">
                        จินตนาการสูง ชอบเรียนรู้ (Openness)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-600 rounded-lg">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-yellow-900 dark:text-yellow-200">
                        Paladin (อัศวิน)
                      </h4>
                      <p className="text-xs opacity-70 text-slate-500 dark:text-slate-400">
                        ระเบียบวินัยสูง รับผิดชอบ (Conscientiousness)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                    <div className="p-2 bg-red-100 dark:bg-red-800 text-red-600 rounded-lg">
                      <Sword size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-red-900 dark:text-red-200">
                        Warrior (นักรบ)
                      </h4>
                      <p className="text-xs opacity-70 text-slate-500 dark:text-slate-400">
                        พลังงานสูง ชอบลุย (Extraversion)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                    <div className="p-2 bg-green-100 dark:bg-green-800 text-green-600 rounded-lg">
                      <Heart size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900 dark:text-green-200">
                        Cleric (นักบวช)
                      </h4>
                      <p className="text-xs opacity-70 text-slate-500 dark:text-slate-400">
                        ใจดี ขี้สงสาร (Agreeableness)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 rounded-lg">
                      <Skull size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-200">
                        Rogue (โจร)
                      </h4>
                      <p className="text-xs opacity-70 text-slate-500 dark:text-slate-400">
                        ไหวพริบดี ระวังตัว (Neuroticism)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Step 2: แนะนำวิธีทำ
                <div className="text-center space-y-6">
                  <p className="text-slate-600 dark:text-slate-300">
                    ให้คะแนนความเป็นตัวคุณ จาก 1 ถึง 5 <br />{" "}
                    โดยเลือกขนาดวงกลมตามความจริง
                  </p>

                  <div className="flex justify-center items-end gap-2 h-20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-500 shadow-lg"></div>
                      <span className="text-[10px] opacity-60 text-slate-500 dark:text-slate-400">
                        ไม่จริงเลย
                      </span>
                    </div>
                    <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-green-500 shadow-lg "></div>
                      <span className="text-[10px] opacity-60 font-bold text-slate-500 dark:text-slate-400">
                        จริงที่สุด!
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 text-sm text-blue-800 dark:text-blue-200">
                    💡 <b>Tip:</b> ตอบตามสัญชาตญาณแรก ไม่ต้องคิดนาน
                    จะได้ผลลัพธ์ที่แม่นยำที่สุด
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 pt-0 shrink-0">
              {tutorialStep === 1 ? (
                <button
                  onClick={() => setTutorialStep(2)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
                >
                  ต่อไป <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={() => setShowGuide(false)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:scale-[1.02] transition"
                >
                  เริ่มพิธีปลุกพลัง! <Play size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Main Content --- */}
      <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
          🚧 DEV DEBUG TOOLS
        </p>
        <div className="flex flex-wrap gap-2">
          {debugButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={() =>
                handleDebugFill(btn.trait, btn.label.split(" ")[0])
              }
              className={`px-3 py-2 rounded-lg text-xs font-bold border hover:scale-105 active:scale-95 transition ${btn.color}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
          พิธีปลุกพลัง{" "}
          <span className="text-indigo-600 dark:text-indigo-400">
            Class Awakening
          </span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          ตอบคำถาม 10 ข้อ เพื่อค้นหาอาชีพและสเตตัสที่แท้จริงของคุณ
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          ชื่อเล่น
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="กรอกชื่อเล่นของคุณ..."
          className="w-full p-4 bg-slate-50 text-black dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
        />
      </div>

      <div className="space-y-12">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Question {idx + 1}/10
              </span>
              <h3 className="text-xl font-medium text-slate-800 text-center dark:text-slate-100 mt-2 leading-relaxed">
                {q.text}
              </h3>
            </div>

            {/* 5-Point Likert Scale UI */}
            <div className="flex items-center justify-between sm:justify-center sm:gap-8 px-2">
              {ratingOptions.map((opt) => (
                <div
                  key={opt.value}
                  className="flex flex-col items-center gap-3 group cursor-pointer"
                  onClick={() => handleSelect(q.id, opt.value)}
                >
                  <div
                    className={`
                              rounded-full transition-all duration-300 flex items-center justify-center border-2
                              ${opt.size}
                              ${
                                answers[q.id] === opt.value
                                  ? `${opt.color} border-transparent scale-110 shadow-lg`
                                  : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 group-hover:border-slate-400"
                              }
                           `}
                  >
                    {answers[q.id] === opt.value && (
                      <CheckCircle2 className="text-white w-1/2 h-1/2" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-bold transition-opacity duration-300 ${
                      answers[q.id] === opt.value
                        ? "opacity-100 text-slate-800 dark:text-white"
                        : "opacity-0 group-hover:opacity-100 text-slate-400"
                    }`}
                  >
                    {opt.label}
                  </span>
                </div>
              ))}
            </div>
            {idx < questions.length - 1 && (
              <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mt-12"></div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 pb-20">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.98] transition disabled:opacity-70 disabled:scale-100"
        >
          {isSubmitting ? "กำลังคำนวณค่าสเตตัส... 🔮" : "ยืนยันการปลุกพลัง"}
        </button>
      </div>
    </div>
  );
}
