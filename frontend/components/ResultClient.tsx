"use client";
import { useRouter } from "next/navigation";
import {
  Flame,
  Wind,
  Mountain,
  Droplets,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import DiscGraph from "@/components/DiscGraph";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// --- Interfaces ---
interface Scores {
  D: number;
  I: number;
  S: number;
  C: number;
}
interface User {
  id: number;
  name: string;
  dominant_type: string;
  animal: string;
  scores: Scores;
}
interface Analysis {
  title: string;
  element_desc: string;
  personality: string;
  weakness: string;
  work_style: string;
  compatible_with: string;
}
interface ResultData {
  user: User;
  analysis: Analysis;
}

// --- Helper Functions ---
const getThemeColor = (type: string) => {
  switch (type) {
    case "D":
      return "bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800";
    case "I":
      return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800";
    case "S":
      return "bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800";
    case "C":
      return "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800";
    default:
      return "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100";
  }
};

const getElementIcon = (type: string) => {
  switch (type) {
    case "D":
      return <Flame size={48} className="text-red-500 dark:text-red-400" />;
    case "I":
      return (
        <Wind size={48} className="text-yellow-500 dark:text-yellow-400" />
      );
    case "S":
      return (
        <Mountain size={48} className="text-green-500 dark:text-green-400" />
      );
    case "C":
      return (
        <Droplets size={48} className="text-blue-500 dark:text-blue-400" />
      );
    default:
      return null;
  }
};

const renderBulletList = (
  text: string | string[] | null | undefined,
  type: "normal" | "warning" = "normal"
) => {
  if (!text) return null;
  let lines: string[] = [];
  if (Array.isArray(text)) lines = text;
  else if (typeof text === "string") lines = text.split("\n");
  else return null;

  lines = lines.filter((line) => line.trim() !== "");

  return (
    <ul className="space-y-3 mt-3">
      {lines.map((line, index) => {
        const cleanText = line.replace(/^[-•*]\s*/, "").trim();
        const isWarning = type === "warning";

        // 🎨 ปรับสีรายการ (List Item) ให้รองรับ Dark Mode
        const itemStyle = isWarning
          ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/50 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30"
          : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-slate-600";

        const Icon = isWarning ? AlertCircle : CheckCircle2;
        const iconColor = isWarning
          ? "text-red-500 dark:text-red-400"
          : "text-blue-500 dark:text-blue-400";

        return (
          <li
            key={index}
            className={`p-3 rounded-lg border flex items-start gap-3 transition-colors duration-200 ${itemStyle}`}
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${iconColor}`} />
            <span className="leading-relaxed text-sm font-medium">
              {cleanText}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

// --- Component หลัก ---
export default function ResultClient({ data }: { data: ResultData }) {
  const router = useRouter();
  const { user, analysis } = data;
  const theme = getThemeColor(user.dominant_type);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const myStoredId = localStorage.getItem("myUserId");

      if (!myStoredId || myStoredId !== String(user.id)) {
        toast.error("แอบดูผลลัพธ์ของคนอื่นไม่ได้นะจ๊ะ 😜", {
          icon: "🔒",
          duration: 4000,
        });
        router.push("/");
      } else {
        setIsAuthorized(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [user.id, router]);

  if (!isAuthorized) {
    return <div className="min-h-screen bg-slate-100 dark:bg-slate-900"></div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 py-10 px-4 transition-colors">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-slate-500 dark:text-slate-400 mb-6 hover:text-slate-900 dark:hover:text-white transition-colors duration-300"
        >
          <ArrowLeft size={20} className="mr-2" /> กลับหน้าหลัก
        </button>

        {/* Header Card */}
        <div
          className={`relative p-8 rounded-2xl shadow-lg border-2 mb-6 text-center ${theme} overflow-hidden`}
        >
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-md mb-4 border border-slate-100 dark:border-slate-700">
              {getElementIcon(user.dominant_type)}
            </div>
            <h1 className="text-3xl font-bold mb-2">{analysis.title}</h1>

            <div className="mt-4 px-4 py-1 bg-white/50 dark:bg-slate-900/30 rounded-full text-sm font-semibold inline-block backdrop-blur-sm">
              สัตว์ประจำตัว: {user.animal} ({user.dominant_type})
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="mb-8 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <DiscGraph scores={user.scores} />

          {/* Explanation Box */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800/50 rounded-lg text-sm flex gap-3 items-start">
            <span className="text-xl mt-0.5">💡</span>
            <div className="leading-relaxed">
              <strong className="block mb-1 text-blue-700 dark:text-blue-300">
                ทำไมจุดของฉันถึงอยู่ตรงกลาง?
              </strong>
              หากตำแหน่งจุดในกราฟดูไม่ตรงกับธาตุหลัก (เช่น
              ได้อินทรีแต่จุดอยู่ตรงกลาง)
              เกิดจากคะแนนธาตุคู่ตรงข้ามของคุณมีค่าสูงพอๆ กัน เช่น สูงทั้ง D และ
              S ทำให้แรงดึงดูดหักล้างกันเองจนจุดเคลื่อนเข้าสู่ศูนย์กลาง
              ซึ่งสะท้อนว่าคุณเป็นคนที่มี <b>ความยืดหยุ่นสูง (Well-Rounded)</b>{" "}
              และสามารถปรับเปลี่ยนสไตล์ได้ตามสถานการณ์ครับ
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* ซ้าย */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                ✨ ตัวตนของคุณ
              </h3>
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                {renderBulletList(analysis.element_desc)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                🍾 จุดเด่นที่เฉิดฉาย
              </h3>
              <div className="text-slate-600 dark:text-slate-300 text-sm">
                {renderBulletList(analysis.personality)}
              </div>
            </div>
          </div>

          {/* ขวา */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                💼 สไตล์การทำงาน
              </h3>
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                {renderBulletList(analysis.work_style)}
              </div>
            </div>

            {/* Warning Card */}
            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-800/50 relative overflow-hidden">
              <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2 relative z-10">
                ⚠️ ด้านมืดที่ต้องระวัง
              </h3>
              <div className="relative z-10 text-red-800/80 dark:text-red-200/80 text-sm">
                {renderBulletList(analysis.weakness, "warning")}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Card */}
        <div className="mt-6 bg-linear-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-pink-100 dark:border-pink-800/30 flex items-center gap-6 shadow-sm">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm text-3xl shrink-0 border border-pink-100 dark:border-slate-700">
            ❤️
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-pink-700 dark:text-pink-300 mb-2">
              คู่หูที่แนะนำ
            </h3>
            <div className="text-slate-700 dark:text-slate-200 text-sm">
              {renderBulletList(analysis.compatible_with)}
            </div>
          </div>
        </div>

        {/* Stat Bars */}
        <div className="mt-6 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            📊 ระดับพลังธาตุ
          </h3>
          <div className="space-y-3">
            {[
              {
                label: "🔥 Fire (D)",
                score: user.scores.D,
                color: "bg-red-500",
              },
              {
                label: "💨 Wind (I)",
                score: user.scores.I,
                color: "bg-yellow-500",
              },
              {
                label: "⛰️ Earth (S)",
                score: user.scores.S,
                color: "bg-green-500",
              },
              {
                label: "💧 Water (C)",
                score: user.scores.C,
                color: "bg-blue-500",
              },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between text-sm mb-1 text-slate-900 dark:text-slate-200">
                  <span>{stat.label}</span>
                  <span className="font-bold">{stat.score}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${stat.color} shadow-sm`}
                    style={{
                      width: `${Math.min((stat.score / 30) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
