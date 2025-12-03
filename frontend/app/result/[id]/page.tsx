"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { Flame, Wind, Mountain, Droplets, ArrowLeft } from "lucide-react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import DiscGraph from "@/components/DiscGraph";
import Link from "next/link";
import toast from "react-hot-toast";

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

export default function ResultPage() {
  const params = useParams();
  const [isHovered, setIsHovered] = useState(false);

  // --- 2. กำหนด Type ให้ State (ใช้ ResultData | null) ---
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลเมื่อเข้ามาหน้านี้
  useEffect(() => {
    let isCancelled = false; // 1. สร้างธงเช็คสถานะ

    const fetchAnalysis = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/users/${params.id}/analysis`
        );

        // 2. เช็คธงก่อนเซ็ตค่า
        if (!isCancelled) {
          setData(res.data);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error(err);
          toast.error("ไม่พบข้อมูลสมาชิกท่านนี้");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    if (params.id) fetchAnalysis();

    // 3. ฟังก์ชัน Cleanup: จะทำงานเมื่อ Component ถูกโหลดซ้ำ
    return () => {
      isCancelled = true; // ยกเลิกของเก่าทิ้งไป
    };
  }, [params.id]);

  // ฟังก์ชันเลือกสีธีมตามธาตุหลัก
  const getThemeColor = (type: string) => {
    switch (type) {
      case "D":
        return "bg-red-50 text-red-900 border-red-200";
      case "I":
        return "bg-yellow-50 text-yellow-900 border-yellow-200";
      case "S":
        return "bg-green-50 text-green-900 border-green-200";
      case "C":
        return "bg-blue-50 text-blue-900 border-blue-200";
      default:
        return "bg-slate-50";
    }
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case "D":
        return <Flame size={48} className="text-red-500" />;
      case "I":
        return <Wind size={48} className="text-yellow-500" />;
      case "S":
        return <Mountain size={48} className="text-green-500" />;
      case "C":
        return <Droplets size={48} className="text-blue-500" />;
      default:
        return null;
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-8 animate-fade-in">
        <div className="animate-spin text-4xl mb-4">🔮</div>
        <div className="text-xl font-semibold text-slate-900">
          กำลังวิเคราะห์ข้อมูล...
        </div>
      </div>
    );
  if (!data) return null;

  const { user, analysis } = data;
  const theme = getThemeColor(user.dominant_type);
  // ฟังก์ชันช่วยแปลงข้อความให้เป็น List สวยๆ (ฉบับกันเหนียว)
  // เปลี่ยนจาก (text: any) เป็น Union Type ที่ชัดเจน
  const renderBulletList = (
    text: string | string[] | null | undefined,
    type: "normal" | "warning" = "normal"
  ) => {
    // 1. ถ้าไม่มีค่า ให้จบเลย
    if (!text) return null;

    let lines: string[] = [];

    // 2. จัดการข้อมูล (Array vs String)
    if (Array.isArray(text)) {
      lines = text;
    } else if (typeof text === "string") {
      lines = text.split("\n");
    } else {
      return null;
    }

    // กรองบรรทัดว่างทิ้ง
    lines = lines.filter((line) => line.trim() !== "");

    return (
      <ul className="space-y-3 mt-3">
        {lines.map((line, index) => {
          const cleanText = line.replace(/^[-•*]\s*/, "").trim();

          // เลือกสไตล์ตามประเภท (ปกติ vs แจ้งเตือน)
          const isWarning = type === "warning";
          const itemStyle = isWarning
            ? "bg-red-50 border-red-100 text-red-800 hover:bg-red-100"
            : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-blue-50 hover:border-blue-200";

          const Icon = isWarning ? AlertCircle : CheckCircle2;
          const iconColor = isWarning ? "text-red-500" : "text-blue-500";

          return (
            <li
              key={index}
              className={`p-3 rounded-lg border flex items-start gap-3 transition-colors duration-200 ${itemStyle}`}
            >
              {/* ไอคอนนำหน้า (ช่วยให้อ่านง่ายขึ้นเยอะ) */}
              <Icon size={18} className={`mt-0.5 shrink-0 ${iconColor}`} />

              {/* เนื้อหา */}
              <span className="leading-relaxed text-sm font-medium">
                {cleanText}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            backgroundColor: isHovered ? "green" : "transparent",
            color: isHovered ? "white" : "gray",
            transition: "0.2s",
          }}
          className="w-fit flex items-center mb-6 px-4 py-2 rounded-lg cursor-pointer"
        >
          <ArrowLeft size={20} className="mr-2" /> กลับหน้าหลัก
        </Link>

        <div
          className={`relative p-8 rounded-2xl shadow-lg border-2 mb-6 text-center ${theme} overflow-hidden`}
        >
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-4 bg-white rounded-full shadow-md mb-4">
              {getElementIcon(user.dominant_type)}
            </div>
            <h1 className="text-3xl font-bold mb-2">{analysis.title}</h1>
            <div className="mt-2 px-4 py-1 rounded-full text-sm font-semibold inline-block">
              สัตว์ประจำตัวของคุณคือ {user.animal} ({user.dominant_type})
            </div>
          </div>
        </div>
        <div className="mb-8">
          <DiscGraph scores={user.scores} />
        </div>
        <div className="mt-4 mb-8 text-center">
          <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 inline-block">
            🤔 <b>เอ๊ะ! ทำไมจุดไม่ตรงกับสัตว์ที่ได้?</b> <br />
            ไม่ต้องตกใจนะครับ หากคะแนนธาตุของคุณสูงหลายด้านพร้อมกัน กราฟจะหา{" "}
            <b>ค่าเฉลี่ย</b> ตรงกลางให้แทน <br></br>ไม่ได้แปลว่าระบบคำนวณผิด
            แต่แปลว่าคุณมีหลายบุคลิกผสมกันครับ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                ✨ ตัวตนของคุณ
              </h3>
              <div className="text-slate-600 leading-relaxed text-sm">
                {renderBulletList(analysis.element_desc)}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                🍾 จุดเด่นของคุณ
              </h3>
              <div className="text-slate-600 text-sm">
                {renderBulletList(analysis.personality)}
              </div>
            </div>
          </div>

          {/* --- COLUMN 2: ขวามือ (การงาน + ด้านมืด) --- */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                💼 สไตล์การทำงาน
              </h3>
              <div className="text-slate-700 text-sm">
                {renderBulletList(analysis.work_style)}
              </div>
            </div>

            {/* 📦 กล่องที่ 4: ด้านมืด (Red Alert) */}
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-red-100 rounded-full blur-xl opacity-50"></div>
              <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2 relative z-10">
                ⚠️ ด้านมืดที่ต้องระวัง
              </h3>
              <div className="relative z-10 text-red-800/80 text-sm">
                {renderBulletList(analysis.weakness, "warning")}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-linear-to-br from-pink-50 to-purple-50 p-6 rounded-2xl border border-pink-100 flex items-center gap-6 shadow-sm">
          <div className="bg-white p-4 rounded-full shadow-sm text-3xl shrink-0 border border-pink-100">
            ❤️
          </div>

          {/* เนื้อหา */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-pink-700 mb-2">
              คู่หูที่แนะนำ
            </h3>
            <div className="text-slate-700 text-sm">
              {renderBulletList(analysis.compatible_with)}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            📊 ระดับพลังธาตุ
          </h3>
          <div className="space-y-3 text-slate-700 font-bold">
            {[
              {
                label: "🔥 Fire, Bull (Dominance)",
                score: user.scores.D,
                color: "bg-red-500",
              },
              {
                label: "💨 Wind, Eagle (Influence)",
                score: user.scores.I,
                color: "bg-yellow-500",
              },
              {
                label: "⛰️ Earth, Mouse (Steadiness)",
                score: user.scores.S,
                color: "bg-green-500",
              },
              {
                label: "💧 Water, Bear (Conscientiousness)",
                score: user.scores.C,
                color: "bg-blue-500",
              },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{stat.label}</span>
                  <span className="font-bold">{stat.score}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${stat.color}`}
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
