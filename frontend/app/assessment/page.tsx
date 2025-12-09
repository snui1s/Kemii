"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Info,
  Play,
  AlertTriangle,
  ChevronRight,
  Flame,
  Wind,
  Mountain,
  Droplets,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import ElementalLoader from "@/components/ElementalLoader";
import { Analytics } from "@vercel/analytics/next";

// --- ข้อมูลคำถาม (Questions) ---
const questions = [
  {
    id: 1,
    text: "เวลาต้องตัดสินใจเรื่องสำคัญ คุณมักจะ ...",
    options: [
      { label: "ตัดสินใจทันทีด้วยความมั่นใจ", value: "D" },
      { label: "ถามความคิดเห็นและแลกเปลี่ยนมุมมองกับคนอื่น", value: "I" },
      { label: "มองหาทางออกที่ทุกคนพอใจและไม่ขัดแย้ง", value: "S" },
      { label: "หาข้อมูลและวิเคราะห์ความเสี่ยงอย่างละเอียด", value: "C" },
    ],
  },
  {
    id: 2,
    text: "เมื่อเริ่มโปรเจกต์ใหม่ คุณมักจะ ...",
    options: [
      { label: "ตั้งเป้าหมายให้ชัดและลุยทันที", value: "D" },
      { label: "วางแผนขั้นตอนและรายละเอียดให้รัดกุม", value: "C" },
      { label: "เสนอไอเดียใหม่ๆ และปลุกใจให้ทีมตื่นเต้น", value: "I" },
      { label: "เตรียมความพร้อมและทำตามระบบอย่างมั่นคง", value: "S" },
    ],
  },
  {
    id: 3,
    text: "เมื่อเจอปัญหาที่ท้าทาย คุณจะ ...",
    options: [
      { label: "ค่อยๆ แก้ไปทีละเปราะอย่างใจเย็น", value: "S" },
      { label: "พุ่งชนปัญหาและหาทางแก้ให้เร็วที่สุด", value: "D" },
      { label: "ชวนเพื่อนร่วมทีมมาช่วยกันคิดหาทางออก", value: "I" },
      { label: "ตรวจสอบข้อมูลเพื่อหาสาเหตุที่แท้จริง", value: "C" },
    ],
  },
  {
    id: 4,
    text: "เวลาที่มีงานด่วนแทรกเข้ามา คุณมักจะ ...",
    options: [
      { label: "เช็คความถูกต้องและลำดับขั้นตอนก่อนทำ", value: "C" },
      { label: "จัดลำดับความสำคัญแล้วรีบเคลียร์ทันที", value: "D" },
      { label: "พยายามรักษาระดับการทำงานให้สม่ำเสมอ", value: "S" },
      { label: "เจรจากับทีมเพื่อขอความร่วมมือ", value: "I" },
    ],
  },
  {
    id: 5,
    text: "เมื่อทีมมีความเห็นไม่ตรงกัน คุณจะ ...",
    options: [
      { label: "พูดคุยเพื่อลดความตึงเครียดและสร้างบรรยากาศที่ดี", value: "I" },
      { label: "ฟันธงเลือกทางที่ดีที่สุดเพื่อให้งานเดินต่อ", value: "D" },
      { label: "ใช้เหตุผลและหลักฐานมาอ้างอิงเพื่อหาข้อยุติ", value: "C" },
      { label: "รับฟังทุกคนและหาจุดกึ่งกลางที่ยอมรับได้", value: "S" },
    ],
  },
  {
    id: 6,
    text: "สไตล์การนำเสนองานของคุณ คือ ...",
    options: [
      { label: "เล่าเรื่องให้น่าสนใจและดึงดูดคนฟัง", value: "I" },
      { label: "กระชับ ตรงประเด็น เน้นผลลัพธ์", value: "D" },
      { label: "นุ่มนวล เข้าใจง่าย และใส่ใจผู้ฟัง", value: "S" },
      { label: "ข้อมูลครบถ้วน มีอ้างอิงและกราฟประกอบ", value: "C" },
    ],
  },
  {
    id: 7,
    text: "เมื่อเกิดข้อผิดพลาดในงาน คุณมักจะ ...",
    options: [
      { label: "วิเคราะห์หาสาเหตุอย่างละเอียดเพื่อไม่ให้ซ้ำรอย", value: "C" },
      { label: "พูดคุยกับทีมเพื่อหากำลังใจและทางแก้ไข", value: "I" },
      { label: "ยอมรับและค่อยๆ แก้ไขตามขั้นตอน", value: "S" },
      { label: "รีบหาทางแก้ปัญหาให้จบโดยเร็ว", value: "D" },
    ],
  },
  {
    id: 8,
    text: "ถ้ามีไอเดียใหม่ๆ ผุดขึ้นมา คุณจะ ...",
    options: [
      { label: "รีบไปเล่าให้คนอื่นฟังเพื่อหาแนวร่วม", value: "I" },
      { label: "ประเมินความเสี่ยงและความเป็นไปได้ก่อน", value: "C" },
      { label: "ดูว่าไอเดียนี้จะกระทบความรู้สึกใครไหม", value: "S" },
      { label: "ลองลงมือทำทันทีเพื่อดูผลลัพธ์", value: "D" },
    ],
  },
  {
    id: 9,
    text: "เมื่อต้องทำงานซ้ำเดิมนานๆ คุณจะ ...",
    options: [
      { label: "หาวิธีทำให้งานเสร็จเร็วขึ้นกว่าเดิม", value: "D" },
      { label: "ทำได้สบายมาก ชอบความมั่นคงและชัดเจน", value: "S" },
      { label: "อาจจะเบื่อ เลยต้องหาคนคุยด้วยแก้เหงา", value: "I" },
      { label: "โฟกัสที่ความแม่นยำและตรวจสอบจุดผิดพลาด", value: "C" },
    ],
  },
  {
    id: 10,
    text: "สไตล์การวางแผนงานของคุณ คือ ...",
    options: [
      { label: "วางแผนที่ยืดหยุ่นและทุกคนในทีมสบายใจ", value: "S" },
      { label: "ระดมสมองเพื่อหาไอเดียที่แปลกใหม่", value: "I" },
      { label: "เน้นเป้าหมายเป็นหลัก วิธีการค่อยว่ากัน", value: "D" },
      { label: "วางแผนละเอียด มี Plan A, Plan B เสมอ", value: "C" },
    ],
  },
  {
    id: 11,
    text: "ถ้าเพื่อนร่วมงานทำงานหลุดแผน คุณจะ ...",
    options: [
      { label: "ตรวจสอบว่าผิดตรงไหนแล้วแจ้งให้แก้ไข", value: "C" },
      { label: "สั่งการให้กลับมาทำตามเป้าหมายทันที", value: "D" },
      { label: "เข้าไปพูดคุยให้กำลังใจเพื่อให้เขาปรับตัว", value: "I" },
      { label: "เข้าไปช่วยประคองให้งานเดินหน้าต่อได้", value: "S" },
    ],
  },
  {
    id: 12,
    text: "สิ่งที่กระตุ้นให้คุณอยากทำงาน คือ ...",
    options: [
      { label: "โอกาสได้แสดงความคิดเห็นและพบปะผู้คน", value: "I" },
      { label: "ความมั่นคงและความสัมพันธ์ที่ดีในทีม", value: "S" },
      { label: "ความสมบูรณ์แบบและความถูกต้องของงาน", value: "C" },
      { label: "ความท้าทายและโอกาสแห่งความสำเร็จ", value: "D" },
    ],
  },
  {
    id: 13,
    text: "เมื่อเห็นเพื่อนร่วมงานทำงานช้ากว่าปกติ คุณจะ ...",
    options: [
      { label: "แนะนำเทคนิคหรือขั้นตอนที่ชัดเจนให้", value: "C" },
      { label: "กระตุ้นให้เร่งมือหน่อย งานจะได้เสร็จทัน", value: "D" },
      { label: "เข้าไปให้กำลังใจและสร้างบรรยากาศเชิงบวก", value: "I" },
      { label: "อาสาเข้าไปช่วยทำเพื่อให้งานเสร็จ", value: "S" },
    ],
  },
  {
    id: 14,
    text: "ถ้าคุณเป็นหัวหน้าทีม สไตล์ของคุณคือ ...",
    options: [
      { label: "ตัดสินใจด้วยข้อมูลและกฎเกณฑ์", value: "C" },
      { label: "ผู้นำที่เด็ดขาด กล้าตัดสินใจ", value: "D" },
      { label: "พี่เลี้ยงที่คอยซัพพอร์ตและรับฟังลูกน้อง", value: "S" },
      { label: "ผู้นำที่สร้างแรงบันดาลใจและเป็นกันเอง", value: "I" },
    ],
  },
  {
    id: 15,
    text: "เมื่อต้องเรียนรู้ทักษะใหม่ๆ คุณชอบที่จะ ...",
    options: [
      { label: "อ่านคู่มือและทำความเข้าใจทฤษฎีก่อน", value: "C" },
      { label: "แลกเปลี่ยนความรู้หรือเรียนรู้ผ่านกลุ่มเพื่อน", value: "I" },
      { label: "ลองผิดลองถูกด้วยตัวเองเดี๋ยวนั้นเลย", value: "D" },
      { label: "ค่อยๆ ฝึกฝนซ้ำๆ จนเกิดความชำนาญ", value: "S" },
    ],
  },
];

const fullQuestions = [...questions].map((q, i) => ({
  ...q,
  id: i + 1,
}));

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DRAFT_KEY = "assessment_draft_answers";

export default function AssessmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1 = อธิบายศัพท์ (Mapping), 2 = วิธีทำข้อสอบ
  const [tutorialStep, setTutorialStep] = useState(1);

  const [answers, setAnswers] = useState<
    Record<number, { most: string | null; least: string | null }>
  >(() => {
    // เช็คก่อนว่ารันบน Browser ไหม (กัน Server Error ใน Next.js)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to load draft", e);
        }
      }
    }
    return {}; // ค่าเริ่มต้นถ้าไม่มี Draft
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 0);

    return () => clearTimeout(timer); // Cleanup (กันเหนียว)
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800">
        <ElementalLoader />
      </div>
    );
  }
  const handleSelect = (
    questionId: number,
    value: string,
    type: "most" | "least"
  ) => {
    const prevAnswer = answers[questionId] || { most: null, least: null };
    const updatedAnswer = { ...prevAnswer };

    if (type === "most" && updatedAnswer.least === value) {
      updatedAnswer.least = null;
    }
    if (type === "least" && updatedAnswer.most === value) {
      updatedAnswer.most = null;
    }

    updatedAnswer[type] = value;
    const newAnswers = {
      ...answers,
      [questionId]: updatedAnswer,
    };
    setAnswers(newAnswers);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(newAnswers));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("กรุณากรอกชื่อก่อนนะครับ 🥺");
      return;
    }

    const answeredCount = Object.values(answers).filter(
      (a) => a.most && a.least
    ).length;
    if (answeredCount < fullQuestions.length) {
      toast.error("ตอบให้ครบทุกข้อก่อนน้า เหลืออีกนิดเดียว");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name,
      answers: Object.entries(answers).map(([qid, val]) => ({
        question_id: Number(qid),
        most_value: val.most,
        least_value: val.least,
      })),
    };

    try {
      const res = await axios.post(`${API_URL}/submit-assessment`, payload);
      const newUser = res.data;
      localStorage.setItem("myUserId", newUser.id.toString());
      localStorage.setItem("myName", newUser.name);
      localStorage.setItem("myAnimal", newUser.animal);
      localStorage.setItem("myScores", JSON.stringify(newUser.scores));
      window.dispatchEvent(new Event("user-updated"));
      localStorage.removeItem(DRAFT_KEY);
      toast.success("บันทึกสำเร็จ! ยินดีต้อนรับคุณ" + name);
      router.push(`/result/${newUser.id}`);
    } catch (err) {
      console.error(err);
      toast.error("อุ๊ย ระบบมีปัญหา ลองใหม่อีกทีนะครับ");
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800">
        <ElementalLoader />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* --- ✨ Tutorial Modal (Updated) --- */}
      {showGuide && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800 text-center shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Info size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {tutorialStep === 1
                  ? "ทำความรู้จัก 4 สไตล์"
                  : "วิธีการทำแบบประเมิน"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {tutorialStep === 1
                  ? "Dominance, Influence, Steadiness และ Compliance"
                  : "อ่านให้ชัวร์ เพื่อผลลัพธ์ที่แม่นยำ"}
              </p>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 overflow-y-auto">
              {tutorialStep === 1 ? (
                // --- Step 1: Mapping Table (แก้ปัญหาเพื่อนงง) ---
                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                      ในระบบนี้เราใช้ 3 สัญลักษณ์แทนสิ่งเดียวกัน <br />
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        ตัวอักษร
                      </span>{" "}
                      ={" "}
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        ธาตุ
                      </span>{" "}
                      ={" "}
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        สัตว์ประจำตัว
                      </span>
                    </p>
                  </div>

                  {/* ตารางเปรียบเทียบชัดๆ */}
                  <div className="space-y-3">
                    {/* D - ไฟ - กระทิง */}
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200 flex items-center justify-center font-black text-lg">
                          D
                        </div>
                        <ArrowRight className="text-red-300" size={16} />
                        <div className="flex items-center gap-1 text-red-700 dark:text-red-300 font-bold">
                          <Flame size={18} /> ไฟ
                        </div>
                        <ArrowRight className="text-red-300" size={16} />
                        <span className="text-red-800 dark:text-red-200 font-bold">
                          กระทิง 🐂
                        </span>
                      </div>
                    </div>

                    {/* I - ลม - อินทรี */}
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-200 flex items-center justify-center font-black text-lg">
                          I
                        </div>
                        <ArrowRight className="text-yellow-300" size={16} />
                        <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-300 font-bold">
                          <Wind size={18} /> ลม
                        </div>
                        <ArrowRight className="text-yellow-300" size={16} />
                        <span className="text-yellow-800 dark:text-yellow-200 font-bold">
                          อินทรี 🦅
                        </span>
                      </div>
                    </div>

                    {/* S - ดิน - หนู */}
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-200 flex items-center justify-center font-black text-lg">
                          S
                        </div>
                        <ArrowRight className="text-green-300" size={16} />
                        <div className="flex items-center gap-1 text-green-700 dark:text-green-300 font-bold">
                          <Mountain size={18} /> ดิน
                        </div>
                        <ArrowRight className="text-green-300" size={16} />
                        <span className="text-green-800 dark:text-green-200 font-bold">
                          หนู 🐁
                        </span>
                      </div>
                    </div>

                    {/* C - น้ำ - หมี */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 flex items-center justify-center font-black text-lg">
                          C
                        </div>
                        <ArrowRight className="text-blue-300" size={16} />
                        <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300 font-bold">
                          <Droplets size={18} /> น้ำ
                        </div>
                        <ArrowRight className="text-blue-300" size={16} />
                        <span className="text-blue-800 dark:text-blue-200 font-bold">
                          หมี 🐻
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // --- Step 2: สอนวิธีทำข้อสอบ ---
                <div className="space-y-6">
                  {/* กฎข้อ 1 */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0 border border-green-200 dark:border-green-500/30">
                      <Check size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-700 dark:text-slate-200">
                        1. ตรงกับคุณมากที่สุด
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        ในแต่ละข้อ ให้เลือก 1
                        ตัวเลือกที่เป็นตัวตนของคุณมากที่สุด (ช่องสีเขียว)
                      </p>
                    </div>
                  </div>

                  {/* กฎข้อ 2 */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-500/30">
                      <X size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-700 dark:text-slate-200">
                        2. ตรงกับคุณน้อยที่สุด
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        และเลือกอีก 1 ตัวเลือก ที่ไม่ใช่ตัวคุณ
                        หรือเป็นตัวคุณน้อยที่สุด (ช่องสีแดง)
                      </p>
                    </div>
                  </div>

                  {/* Visual Aid (แก้บั๊ก div ปิดเกินจากรอบที่แล้ว) */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 uppercase font-bold tracking-wider text-center">
                      ตัวอย่างการตอบคำถาม
                    </p>

                    <div className="space-y-3">
                      {/* ตัวอย่าง 1 */}
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-1 bg-green-500 rounded-r-full"></div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium pl-2">
                          เป็นคนชอบเข้าสังคม
                        </span>
                        <div className="flex gap-2 relative z-10">
                          <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-none scale-110">
                            <Check size={20} strokeWidth={3} />
                          </div>
                          <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 flex items-center justify-center opacity-50">
                            <X size={20} strokeWidth={3} />
                          </div>
                        </div>
                      </div>

                      {/* ตัวอย่าง 2 */}
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-1 bg-red-500 rounded-r-full"></div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium pl-2">
                          ชอบทำงานคนเดียวเงียบๆ
                        </span>
                        <div className="flex gap-2 relative z-10">
                          {/* ปุ่มเขียว (Inactive) */}
                          <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 flex items-center justify-center opacity-50">
                            <Check size={20} strokeWidth={3} />
                          </div>
                          {/* ปุ่มแดง (Active) */}
                          <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg scale-110 transition-transform">
                            <X size={20} strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="p-6 pt-0 shrink-0">
              {tutorialStep === 1 ? (
                // ปุ่ม "ถัดไป"
                <button
                  onClick={() => setTutorialStep(2)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  ถัดไป: วิธีทำข้อสอบ <ChevronRight size={20} />
                </button>
              ) : (
                // ปุ่ม "เริ่มเลย" & "ย้อนกลับ"
                <div className="flex gap-3">
                  <button
                    onClick={() => setTutorialStep(1)}
                    className="w-1/3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-3.5 rounded-xl font-bold text-sm transition"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    onClick={() => setShowGuide(false)}
                    className="w-2/3 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-slate-200 dark:shadow-indigo-900/20 transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    เข้าใจแล้ว! เริ่มเลย <Play size={20} fill="currentColor" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- ส่วนแบบประเมิน (เหมือนเดิม) --- */}
      <h1 className="text-3xl font-bold text-center mb-2 text-slate-800 dark:text-white">
        แบบประเมิน 4Elements
      </h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
        ค้นหานิสัยประจำตัวของคุณในการทำงาน
      </p>

      {/* กล่องเตือน */}
      <div className="mb-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50 flex items-start gap-3 animate-pulse-slow">
        <div className="p-2 bg-orange-100 dark:bg-orange-800/30 rounded-full text-orange-600 dark:text-orange-400 shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="font-bold text-orange-800 dark:text-orange-200 text-lg">
            สำหรับคนที่ไม่ยอมอ่าน ต้องตอบ 2 ช่องต่อ 1 ข้อ
          </h3>
          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1 leading-relaxed">
            ต้องเลือกทั้ง{" "}
            <span className="font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1 rounded">
              ✅ มากที่สุด
            </span>{" "}
            และ{" "}
            <span className="font-bold text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1 rounded">
              ❌ น้อยที่สุด
            </span>{" "}
            ให้ครบทุกข้อ ไม่งั้นจะกดส่งไม่ได้นะจ้ะ
          </p>
        </div>
      </div>

      {/* ส่วนกรอกชื่อ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 transition-colors">
        <label className="block font-semibold mb-2 text-slate-900 dark:text-slate-200">
          ชื่อเล่นของคุณ
        </label>
        <input
          type="text"
          className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
          placeholder="กรอกชื่อเล่น..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {fullQuestions.map((q, index) => {
          const ans = answers[q.id] || { most: null, least: null };

          return (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-100">
                <span className="text-blue-600 dark:text-blue-400 mr-2">
                  ข้อ {index + 1}.
                </span>
                {q.text}
              </h3>

              <div className="grid grid-cols-12 gap-2 text-sm text-gray-400 dark:text-gray-500 mb-2 px-2">
                <div className="col-span-8">
                  เลือกความน่าจะทำมากสุดและน้อยสุด
                </div>
                <div className="col-span-2 text-center text-green-600 dark:text-green-400 font-bold">
                  มากที่สุด
                </div>
                <div className="col-span-2 text-center text-red-500 dark:text-red-400 font-bold">
                  น้อยที่สุด
                </div>
              </div>

              <div className="space-y-2">
                {q.options.map((opt) => (
                  <div
                    key={opt.value}
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="col-span-8 text-slate-700 dark:text-slate-300">
                      {opt.label}
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => handleSelect(q.id, opt.value, "most")}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                          ${
                            ans.most === opt.value
                              ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30 scale-105"
                              : "border-gray-200 dark:border-slate-700 text-gray-300 dark:text-slate-600 hover:border-green-300 dark:hover:border-green-700"
                          }
                        `}
                      >
                        <Check size={20} />
                      </button>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => handleSelect(q.id, opt.value, "least")}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                          ${
                            ans.least === opt.value
                              ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30 scale-105"
                              : "border-gray-200 dark:border-slate-700 text-gray-300 dark:text-slate-600 hover:border-red-300 dark:hover:border-red-700"
                          }
                        `}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Analytics />

      <div className="mt-10 bottom-4 pb-12">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.01] active:scale-[0.98] transition disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
        >
          {isSubmitting ? "กำลังคำนวณธาตุ... 🔮" : "ส่งผลประเมิน"}
        </button>
      </div>
    </div>
  );
}
