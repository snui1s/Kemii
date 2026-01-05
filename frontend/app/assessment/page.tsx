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
import { useAuth } from "@/context/AuthContext";

const questions = [
  // 1. Extraversion (+)
  { id: 1, type: 1, math: "+", text: "เรามักเป็นตัวสร้างสีสันในงานสังสรรค์" },
  // 2. Agreeableness (-)
  {
    id: 2,
    type: 2,
    math: "-",
    text: "เราไม่ค่อยใส่ใจความรู้สึกของคนอื่นเท่าไหร่",
  },
  // 3. Conscientiousness (+)
  { id: 3, type: 3, math: "+", text: "เรามักเตรียมตัวให้พร้อมอยู่เสมอ" },
  // 4. Neuroticism (-)
  { id: 4, type: 4, math: "-", text: "เรารู้สึกเครียดได้ง่าย" },
  // 5. Openness (+)
  {
    id: 5,
    type: 5,
    math: "+",
    text: "เรารู้จักคำศัพท์เยอะและเลือกใช้คำได้หลากหลาย",
  },
  // 6. Extraversion (-)
  { id: 6, type: 1, math: "-", text: "เราเป็นคนพูดน้อย" },
  // 7. Agreeableness (+)
  { id: 7, type: 2, math: "+", text: "เราสนใจความเป็นไปของผู้อื่น" },
  // 8. Conscientiousness (-)
  { id: 8, type: 3, math: "-", text: "เรามักวางของทิ้งไว้ไม่เป็นที่เป็นทาง" },
  // 9. Neuroticism (+)
  {
    id: 9,
    type: 4,
    math: "+",
    text: "เรารู้สึกผ่อนคลายและสบายใจเกือบตลอดเวลา",
  },
  // 10. Openness (-)
  {
    id: 10,
    type: 5,
    math: "-",
    text: "เราเข้าใจเรื่องที่เป็นนามธรรมหรือทฤษฎีซับซ้อนได้ยาก",
  },
  // 11. Extraversion (+)
  {
    id: 11,
    type: 1,
    math: "+",
    text: "เรารู้สึกสบายใจเวลาอยู่ท่ามกลางผู้คนเยอะๆ",
  },
  // 12. Agreeableness (-)
  { id: 12, type: 2, math: "-", text: "เรามักเผลอพูดจาไม่ถนอมน้ำใจคนอื่น" },
  // 13. Conscientiousness (+)
  { id: 13, type: 3, math: "+", text: "เราเป็นคนใส่ใจในรายละเอียด" },
  // 14. Neuroticism (-)
  {
    id: 14,
    type: 4,
    math: "-",
    text: "เรามักจะกังวลใจกับเรื่องต่างๆ อยู่เสมอ",
  },
  // 15. Openness (+)
  { id: 15, type: 5, math: "+", text: "เราเป็นคนจินตนาการสูง" },
  // 16. Extraversion (-)
  { id: 16, type: 1, math: "-", text: "เราชอบอยู่เงียบๆ ไม่ชอบทำตัวเด่น" },
  // 17. Agreeableness (+)
  { id: 17, type: 2, math: "+", text: "เรามีความเห็นอกเห็นใจผู้อื่น" },
  // 18. Conscientiousness (-)
  { id: 18, type: 3, math: "-", text: "เรามักทำข้าวของรก ไม่เป็นระเบียบ" },
  // 19. Neuroticism (+)
  { id: 19, type: 4, math: "+", text: "เราไม่ค่อยรู้สึกหดหู่หรือซึมเศร้า" },
  // 20. Openness (-)
  { id: 20, type: 5, math: "-", text: "เราไม่ค่อยอินกับเรื่องที่เป็นนามธรรม" },
  // 21. Extraversion (+)
  { id: 21, type: 1, math: "+", text: "เรามักเป็นฝ่ายชวนคุยก่อนเสมอ" },
  // 22. Agreeableness (-)
  { id: 22, type: 2, math: "-", text: "เราไม่ค่อยอยากรับรู้ปัญหาของคนอื่น" },
  // 23. Conscientiousness (+)
  {
    id: 23,
    type: 3,
    math: "+",
    text: "เรารีบจัดการงานบ้านหรือธุระให้เสร็จทันที ไม่ชอบดองไว้",
  },
  // 24. Neuroticism (-)
  {
    id: 24,
    type: 4,
    math: "-",
    text: "เรารู้สึกปั่นป่วนใจได้ง่ายเมื่อมีเรื่องมากระทบ",
  },
  // 25. Openness (+)
  { id: 25, type: 5, math: "+", text: "เรามักจะปิ๊งไอเดียเจ๋งๆ อยู่เสมอ" },
  // 26. Extraversion (-)
  { id: 26, type: 1, math: "-", text: "เราไม่ค่อยมีเรื่องอะไรจะคุยกับคนอื่น" },
  // 27. Agreeableness (+)
  { id: 27, type: 2, math: "+", text: "เราเป็นคนใจอ่อน ขี้สงสาร" },
  // 28. Conscientiousness (-)
  { id: 28, type: 3, math: "-", text: "เรามักลืมเก็บของเข้าที่ให้เป็นระเบียบ" },
  // 29. Neuroticism (-)
  { id: 29, type: 4, math: "-", text: "เราอารมณ์เสียหรือหัวร้อนได้ง่าย" },
  // 30. Openness (-)
  { id: 30, type: 5, math: "-", text: "เราเป็นคนจินตนาการไม่ค่อยเก่ง" },
  // 31. Extraversion (+)
  {
    id: 31,
    type: 1,
    math: "+",
    text: "เราชอบคุยกับผู้คนหลากหลายในงานสังสรรค์",
  },
  // 32. Agreeableness (-)
  { id: 32, type: 2, math: "-", text: "เราไม่ค่อยสนใจเรื่องของคนอื่นเท่าไหร่" },
  // 33. Conscientiousness (+)
  { id: 33, type: 3, math: "+", text: "เราชอบความเป็นระเบียบเรียบร้อย" },
  // 34. Neuroticism (-)
  { id: 34, type: 4, math: "-", text: "อารมณ์เราขึ้นๆ ลงๆ เปลี่ยนแปลงบ่อย" },
  // 35. Openness (+)
  { id: 35, type: 5, math: "+", text: "เราหัวไว เข้าใจอะไรได้เร็ว" },
  // 36. Extraversion (-)
  { id: 36, type: 1, math: "-", text: "เราไม่ชอบทำตัวเด่นหรือเป็นจุดสนใจ" },
  // 37. Agreeableness (+)
  { id: 37, type: 2, math: "+", text: "เราพร้อมสละเวลาช่วยเหลือผู้อื่นเสมอ" },
  // 38. Conscientiousness (-)
  {
    id: 38,
    type: 3,
    math: "-",
    text: "เรามักจะหลบเลี่ยงหน้าที่หรือความรับผิดชอบ",
  },
  // 39. Neuroticism (-)
  {
    id: 39,
    type: 4,
    math: "-",
    text: "เรามีอารมณ์แปรปรวนบ่อย เดี๋ยวดีเดี๋ยวร้าย",
  },
  // 40. Openness (+)
  {
    id: 40,
    type: 5,
    math: "+",
    text: "เราชอบใช้คำศัพท์ยากๆ หรือคำที่มีความหมายลึกซึ้ง",
  },
  // 41. Extraversion (+)
  {
    id: 41,
    type: 1,
    math: "+",
    text: "เราโอเคกับการเป็นจุดสนใจหรือตกเป็นเป้าสายตา",
  },
  // 42. Agreeableness (+)
  {
    id: 42,
    type: 2,
    math: "+",
    text: "เราสัมผัสและรับรู้อารมณ์ของคนอื่นได้ไว",
  },
  // 43. Conscientiousness (+)
  {
    id: 43,
    type: 3,
    math: "+",
    text: "เราใช้ชีวิตตามตารางเวลาที่วางไว้อย่างเคร่งครัด",
  },
  // 44. Neuroticism (-)
  { id: 44, type: 4, math: "-", text: "เรารู้สึกหงุดหงิดรำคาญใจได้ง่าย" },
  // 45. Openness (+)
  {
    id: 45,
    type: 5,
    math: "+",
    text: "เราชอบใช้เวลาคิดทบทวนเรื่องราวต่างๆ อย่างลึกซึ้ง",
  },
  // 46. Extraversion (-)
  {
    id: 46,
    type: 1,
    math: "-",
    text: "เรามักจะเงียบเวลาอยู่ท่ามกลางคนแปลกหน้า",
  },
  // 47. Agreeableness (+)
  {
    id: 47,
    type: 2,
    math: "+",
    text: "เราทำให้คนอื่นรู้สึกผ่อนคลายและสบายใจเมื่ออยู่ด้วย",
  },
  // 48. Conscientiousness (+)
  { id: 48, type: 3, math: "+", text: "เราเป็นคนทำงานละเอียดและพิถีพิถัน" },
  // 49. Neuroticism (-)
  { id: 49, type: 4, math: "-", text: "เรามักรู้สึกเศร้าหมองอยู่บ่อยครั้ง" },
  // 50. Openness (+)
  { id: 50, type: 5, math: "+", text: "ในหัวเรามีไอเดียผุดขึ้นมาเต็มไปหมด" },
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
  const { token, user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    // 1. Load progress on mount
    const saved = localStorage.getItem("assessment_progress");
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
        toast.success("Restore progress from last session");
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // 2. Save progress on change
    if (Object.keys(answers).length > 0) {
      localStorage.setItem("assessment_progress", JSON.stringify(answers));
    }
  }, [answers]);

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
  const handleDebugFill = (
    targetType: number | "random",
    namePrefix: string
  ) => {
    const newAnswers: Record<number, number> = {};

    questions.forEach((q) => {
      let baseScore;

      if (targetType === "random") {
        // Random 1-5
        baseScore = Math.floor(Math.random() * 5) + 1;
      } else if (q.type === targetType) {
        // Target: High score (4 or 5)
        const high = Math.random() > 0.3 ? 5 : 4;
        // Adjust for Math direction to get the desired *Result*
        // If Math is +, answer high. If Math is -, answer low (1 or 2).
        baseScore = q.math === "+" ? high : 6 - high;
      } else {
        // Others: Medium score (2, 3, or 4)
        const mid = Math.floor(Math.random() * 3) + 2;
        baseScore = q.math === "+" ? mid : 6 - mid;
      }

      newAnswers[q.id] = baseScore;
    });

    setAnswers(newAnswers);
    toast.success(`Debug: Filled for ${namePrefix}`);
  };

  const debugButtons = [
    {
      label: "Mage (O)",
      type: 5,
      color: "text-purple-400 border-purple-500/50",
    },
    {
      label: "Paladin (C)",
      type: 3,
      color: "text-yellow-400 border-yellow-500/50",
    },
    {
      label: "Warrior (E)",
      type: 1,
      color: "text-red-400 border-red-500/50",
    },
    {
      label: "Cleric (A)",
      type: 2,
      color: "text-green-400 border-green-500/50",
    },
    {
      label: "Rogue (N)",
      type: 4,
      color: "text-blue-400 border-blue-500/50",
    },
    {
      label: "🎲 Random",
      type: "random",
      color: "text-slate-500 border-slate-500/50",
    },
  ];

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error(
        `ตอบให้ครบ ${questions.length} ข้อก่อนนะ (ตอนนี้ ${
          Object.keys(answers).length
        }/${questions.length})`
      );
      return;
    }
    setIsSubmitting(true);

    const scores = {
      1: 0, // Extraversion
      2: 0, // Agreeableness
      3: 0, // Conscientiousness
      4: 0, // Neuroticism
      5: 0, // Openness
    };

    questions.forEach((q) => {
      const rawScore = answers[q.id] || 0;
      let finalScore = 0;

      if (q.math === "+") {
        finalScore = rawScore;
      } else {
        finalScore = 6 - rawScore;
      }

      // @ts-ignore
      scores[q.type] += finalScore;
    });

    const payload = {
      extraversion: scores[1],
      agreeableness: scores[2],
      conscientiousness: scores[3],
      neuroticism: scores[4],
      openness: scores[5],
    };

    try {
      let res;
      if (token && user) {
        // Authenticated Submission
        res = await axios.post(`${API_URL}/users/me/assessment`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Guest Submission (Fallback)
        res = await axios.post(`${API_URL}/submit-assessment`, payload);
      }

      const newUser = res.data;
      // No token setting here anymore!

      if (token) {
        await refreshUser();
      }

      // 3. Clear progress on success
      localStorage.removeItem("assessment_progress");

      toast.success(`ปลุกพลังสำเร็จ! ยินดีต้อนรับคุณ ${newUser.name}`);
      router.push(`/assessment/result/${newUser.id}`);
    } catch (err) {
      console.error(err);
      toast.error("ระบบขัดข้อง! โปรดลองใหม่อีกครั้ง");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/20 relative overflow-hidden transition-colors">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-200/20 dark:bg-purple-900/15 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-slate-200/30 dark:bg-slate-800/30 rounded-full blur-[80px]" />
      </div>

      {/* --- Tutorial Modal --- */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-black/30 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[75vh] shadow-2xl">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 text-center">
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
            <div className="p-4 sm:p-6 overflow-y-auto">
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
                      className={`flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-${cls.color}-500/50 transition-colors`}
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
            <div className="p-4 sm:p-6 pt-0">
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
                  handleDebugFill(
                    btn.type as number | "random",
                    btn.label.split(" ")[0]
                  )
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
            ตอบคำถาม 50 ข้อ เพื่อค้นหาอาชีพและสเตตัสที่แท้จริงของคุณ
          </p>
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
                  Question {idx + 1}/50
                </span>
                <h3 className="text-lg sm:text-xl font-medium text-slate-800 dark:text-white mt-2 leading-relaxed text-center">
                  {q.text}
                </h3>
              </div>

              {/* Spirit Orbs - Glowing Runes */}
              <div className="flex items-center justify-between gap-1 sm:gap-4 max-w-md mx-auto">
                {ratingOptions.map((opt) => {
                  const isSelected = answers[q.id] === opt.value;
                  // Mobile (375px): sizes 32-52, Desktop: sizes 36-60
                  const mobileSize = 28 + opt.value * 5; // 33, 38, 43, 48, 53
                  const desktopSize = 32 + opt.value * 6; // 38, 44, 50, 56, 62
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
                        style={{
                          width: `clamp(${mobileSize}px, 9vw, ${desktopSize}px)`,
                          height: `clamp(${mobileSize}px, 9vw, ${desktopSize}px)`,
                        }}
                      >
                        {isSelected && (
                          <CheckCircle2 className="text-white w-1/2 h-1/2" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                          isSelected
                            ? "opacity-100 text-slate-800 dark:text-white"
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
