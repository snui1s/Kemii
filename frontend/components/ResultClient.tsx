"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Shield,
  Sword,
  Wand,
  Heart,
  Skull,
  ChevronRight,
  Scroll,
  Star,
  AlertTriangle,
  Users,
} from "lucide-react";
import Link from "next/link";

// --- Types ---
interface OceanScores {
  Openness: number;
  Conscientiousness: number;
  Extraversion: number;
  Agreeableness: number;
  Neuroticism: number;
}

interface UserData {
  id: number;
  name: string;
  character_class: string;
  level: number;
  ocean_scores?: OceanScores;
  ocean_openness?: number;
  ocean_conscientiousness?: number;
  ocean_extraversion?: number;
  ocean_agreeableness?: number;
  ocean_neuroticism?: number;
}

interface AnalysisData {
  class_title: string;
  prophecy: string;
  strengths: string[];
  weaknesses: string[];
  best_partner: string;
}

interface ResultClientProps {
  user: UserData;
  analysis: AnalysisData;
}

// --- Theme Config ---
const CLASS_THEMES = {
  Mage: {
    icon: <Wand size={64} />,
    color: "from-purple-500 to-indigo-600",
    border: "border-purple-500",
    statColor: "#a855f7",
    softBg:
      "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5",
    softText: "text-purple-700 dark:text-purple-300",
  },
  Paladin: {
    icon: <Shield size={64} />,
    color: "from-yellow-500 to-amber-600",
    border: "border-yellow-500",
    statColor: "#eab308",
    softBg:
      "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5",
    softText: "text-yellow-700 dark:text-yellow-300",
  },
  Warrior: {
    icon: <Sword size={64} />,
    color: "from-red-500 to-rose-600",
    border: "border-red-500",
    statColor: "#ef4444",
    softBg:
      "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5",
    softText: "text-red-700 dark:text-red-300",
  },
  Cleric: {
    icon: <Heart size={64} />,
    color: "from-green-500 to-emerald-600",
    border: "border-green-500",
    statColor: "#22c55e",
    softBg:
      "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5",
    softText: "text-green-700 dark:text-green-300",
  },
  Rogue: {
    icon: <Skull size={64} />,
    color: "from-blue-900 to-indigo-900",
    border: "border-blue-900",
    statColor: "#1e3a5f",
    softBg:
      "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5",
    softText: "text-blue-900 dark:text-blue-300",
  },
} as const;

type ClassName = keyof typeof CLASS_THEMES;

// --- Helper Functions ---
function getTheme(characterClass: string | undefined | null) {
  // แปลงชื่อไทย -> อังกฤษ
  let key = (characterClass || "Warrior").trim();
  if (key.includes("เวทย์") || key.includes("Mage")) key = "Mage";
  else if (key.includes("อัศวิน") || key.includes("Paladin")) key = "Paladin";
  else if (key.includes("นักรบ") || key.includes("Warrior")) key = "Warrior";
  else if (key.includes("นักบวช") || key.includes("Cleric")) key = "Cleric";
  else if (key.includes("โจร") || key.includes("Rogue")) key = "Rogue";

  return CLASS_THEMES[key as ClassName] || CLASS_THEMES.Warrior;
}

function cleanText(text: string | undefined): string {
  if (!text) return "";
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/##/g, "").trim();
}

// --- Main Component ---
export default function ResultClient({ user, analysis }: ResultClientProps) {
  // ดึงคะแนน OCEAN
  const scores = user.ocean_scores || {
    Openness: user.ocean_openness || 0,
    Conscientiousness: user.ocean_conscientiousness || 0,
    Extraversion: user.ocean_extraversion || 0,
    Agreeableness: user.ocean_agreeableness || 0,
    Neuroticism: user.ocean_neuroticism || 0,
  };

  // สร้างข้อมูลสำหรับ Radar Chart
  const statsData = [
    { subject: `O ${scores.Openness}`, A: scores.Openness, fullMark: 50 },
    {
      subject: `C ${scores.Conscientiousness}`,
      A: scores.Conscientiousness,
      fullMark: 50,
    },
    {
      subject: `E ${scores.Extraversion}`,
      A: scores.Extraversion,
      fullMark: 50,
    },
    {
      subject: `A ${scores.Agreeableness}`,
      A: scores.Agreeableness,
      fullMark: 50,
    },
    {
      subject: `N ${scores.Neuroticism}`,
      A: scores.Neuroticism,
      fullMark: 50,
    },
  ];

  // ดึง Theme ตาม Class
  const theme = getTheme(user.character_class);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 font-[family-name:var(--font-line-seed)] flex justify-center items-center relative overflow-hidden transition-colors duration-300">
      
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* --- LEFT: HERO CARD --- */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div
            className={`relative p-[1px] rounded-3xl bg-gradient-to-b from-black/5 to-black/0 dark:from-white/10 dark:to-white/0`}
          >
            <div className="bg-[var(--background)]/80 backdrop-blur-xl rounded-[22px] p-6 flex flex-col items-center text-center h-full relative overflow-hidden border border-black/5 dark:border-white/5">
              {/* Badge */}
              <div className="absolute top-4 right-4 bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full text-xs font-mono text-[var(--highlight)] border border-transparent">
                LV. {user.level || 1}
              </div>

              {/* Class Icon */}
              <div
                className={`mt-4 mb-4 p-5 rounded-full bg-black/5 dark:bg-white/5 border border-transparent ${theme.border} shadow-sm`}
              >
                <div className="text-[var(--foreground)] drop-shadow-sm">
                  {theme.icon}
                </div>
              </div>

              {/* Titles */}
              <h2 className="text-2xl font-light text-[var(--foreground)] mb-1">
                {user.name}
              </h2>
              <div
                className={`px-4 py-1 rounded-lg text-sm font-bold bg-gradient-to-r ${theme.color} text-white mb-4 shadow-md inline-block`}
              >
                {cleanText(analysis.class_title) || user.character_class}
              </div>

              {/* Stats Graph */}
              <div className="w-full h-[220px] relative mt-2 opacity-90">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    data={statsData}
                  >
                    <PolarGrid stroke="var(--muted)" strokeOpacity={0.3} />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fill: "var(--muted)",
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 50]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      dataKey="A"
                      stroke={theme.statColor}
                      strokeWidth={2}
                      fill={theme.statColor}
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="mt-6 grid grid-cols-1 gap-1 text-[12px] text-[var(--muted)] text-left w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl border border-transparent">
                <div className="flex justify-between">
                  <span>
                    <b>O</b>penness
                  </span>{" "}
                  <span className="opacity-70">เปิดรับ/จินตนาการ</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    <b>C</b>onscientiousness
                  </span>{" "}
                  <span className="opacity-70">ระเบียบ/เป้าหมาย</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    <b>E</b>xtraversion
                  </span>{" "}
                  <span className="opacity-70">สังคม/พลังงาน</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    <b>A</b>greeableness
                  </span>{" "}
                  <span className="opacity-70">เห็นใจ/ประนีประนอม</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    <b>N</b>euroticism
                  </span>{" "}
                  <span className="opacity-70">ความแปรปรวนทางอารมณ์</span>
                </div>
              </div>
            </div>
          </div>

          <Link href="/" className="block">
            <button className="w-full bg-[var(--background)]/80 hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/5 text-[var(--muted)] hover:text-[var(--foreground)] py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
              <ChevronRight size={18} /> ข้ามไปหน้าหลัก
            </button>
          </Link>
        </div>

        {/* --- RIGHT: AI ANALYSIS --- */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 1. The Prophecy */}
          <div className="rounded-3xl p-8 bg-[var(--background)]/80 border border-black/5 dark:border-white/5 shadow-lg relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none scale-150 text-[var(--foreground)]">
              {theme.icon}
            </div>

            <h3 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2 opacity-80">
              <Scroll className="text-[var(--highlight)]" /> Guild Master&apos;s
              Prophecy
            </h3>
            <p className="text-[var(--foreground)] opacity-60 leading-relaxed text-lg font-medium">
              {cleanText(analysis.prophecy)}
            </p>
          </div>

          {/* 2. Combat Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--background)]/60 backdrop-blur-md p-6 rounded-2xl border border-green-500/20 shadow-sm">
              <h4 className="text-green-600 dark:text-green-400 font-bold mb-4 flex items-center gap-2 uppercase text-sm tracking-wider">
                <Star size={16} /> Heroic Strengths
              </h4>
              <ul className="space-y-3">
                {analysis.strengths?.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-[var(--muted)] text-sm"
                  >
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    {cleanText(s)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[var(--background)]/60 backdrop-blur-md p-6 rounded-2xl border border-red-500/20 shadow-sm">
              <h4 className="text-red-600 dark:text-red-400 font-bold mb-4 flex items-center gap-2 uppercase text-sm tracking-wider">
                <AlertTriangle size={16} /> Fatal Flaws
              </h4>
              <ul className="space-y-3">
                {analysis.weaknesses?.map((w, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-[var(--muted)] text-sm"
                  >
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {cleanText(w)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3. Soulmate */}
          <div
            className={`p-6 rounded-2xl bg-[var(--background)]/60 backdrop-blur-md border border-black/5 dark:border-white/5 flex items-start gap-4 shadow-sm`}
          >
            <div
              className={`p-3 rounded-xl bg-black/5 dark:bg-white/5 text-[var(--foreground)]`}
            >
              <Users size={24} />
            </div>
            <div>
              <h4 className={`text-[var(--foreground)] font-bold mb-1 opacity-80`}>
                Recommended Party Member
              </h4>
              <p className="text-[var(--muted)] text-sm opacity-80">
                {cleanText(analysis.best_partner)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
