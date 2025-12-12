"use client";
import { useState, useEffect } from "react";
import {
  User,
  Wand,
  Shield,
  Sword,
  Heart,
  Skull,
  Sparkles,
  Eye,
} from "lucide-react";

interface UserCardProps {
  name?: string;
  animal?: string;
  type?: string;
  id?: number;
  scores?: { [key: string]: number };
  onInspect?: () => void;
  allowFlip?: boolean;
}

interface Particle {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
}

// 🎨 Theme Config ตาม Class
const CLASS_CONFIG = {
  Mage: {
    color: "#a855f7",
    gradient: "from-purple-600 via-indigo-600 to-purple-700",
    glow: "shadow-purple-500/30",
    icon: Wand,
  },
  Paladin: {
    color: "#eab308",
    gradient: "from-yellow-500 via-amber-500 to-orange-500",
    glow: "shadow-yellow-500/30",
    icon: Shield,
  },
  Warrior: {
    color: "#ef4444",
    gradient: "from-red-600 via-rose-600 to-red-700",
    glow: "shadow-red-500/30",
    icon: Sword,
  },
  Cleric: {
    color: "#22c55e",
    gradient: "from-green-500 via-emerald-500 to-green-600",
    glow: "shadow-green-500/30",
    icon: Heart,
  },
  Rogue: {
    color: "#1e3a5f",
    gradient: "from-blue-900 via-indigo-900 to-slate-900",
    glow: "shadow-blue-900/30",
    icon: Skull,
  },
  Novice: {
    color: "#94a3b8",
    gradient: "from-slate-400 via-gray-400 to-slate-500",
    glow: "shadow-slate-400/20",
    icon: User,
  },
};

type ClassName = keyof typeof CLASS_CONFIG;

function getClassKey(className: string): ClassName {
  const safe = (className || "").trim();
  if (safe.includes("Mage") || safe.includes("เวทย์")) return "Mage";
  if (safe.includes("Paladin") || safe.includes("อัศวิน")) return "Paladin";
  if (safe.includes("Warrior") || safe.includes("นักรบ")) return "Warrior";
  if (safe.includes("Cleric") || safe.includes("นักบวช")) return "Cleric";
  if (safe.includes("Rogue") || safe.includes("โจร")) return "Rogue";
  return "Novice";
}

export default function UserCard({
  name = "Unknown Hero",
  animal = "Novice",
  type = "Lv.1",
  id,
  scores,
  onInspect,
  allowFlip = false,
}: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const classKey = getClassKey(animal);
  const config = CLASS_CONFIG[classKey];
  const IconComponent = config.icon;

  useEffect(() => {
    const generated = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2000,
      duration: Math.random() * 1000 + 2000,
      size: Math.random() * 4 + 2,
    }));
    setParticles(generated);
  }, []);

  const handleClick = () => {
    if (allowFlip) {
      setIsFlipped(!isFlipped);
    } else if (onInspect) {
      onInspect();
    } else if (id) {
      window.location.href = `/assessment/result/${id}`;
    }
  };

  return (
    <div
      className="relative w-full cursor-pointer group"
      style={{ perspective: "1000px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div
        className="relative w-full transition-all duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ========== FRONT SIDE ========== */}
        <div
          className={`
            relative w-full overflow-hidden rounded-xl sm:rounded-2xl
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-700
            shadow-lg ${isHovered ? config.glow : ""}
            transition-all duration-300
            ${isHovered ? "scale-[1.02]" : ""}
          `}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Top Gradient Bar */}
          <div
            className={`h-1.5 sm:h-2 w-full bg-gradient-to-r ${config.gradient}`}
          />

          {/* Particle FX */}
          {isHovered &&
            particles.map((p) => (
              <div
                key={p.id}
                className="absolute pointer-events-none animate-float-up"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  color: config.color,
                  animationDelay: `${p.delay}ms`,
                  animationDuration: `${p.duration}ms`,
                }}
              >
                <Sparkles size={p.size} />
              </div>
            ))}

          {/* Content */}
          <div className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              {/* Left: Info */}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate transition-colors"
                  style={{ color: isHovered ? config.color : undefined }}
                >
                  {name}
                </h3>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                  {/* Class Badge */}
                  <span
                    className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: config.color }}
                  >
                    {animal}
                  </span>
                  {/* Level */}
                  <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                    {type}
                  </span>
                </div>
              </div>

              {/* Right: Icon */}
              <div
                className={`
                  p-2 sm:p-3 rounded-xl shrink-0
                  transition-all duration-300
                  ${isHovered ? "rotate-6 scale-110" : ""}
                `}
                style={{
                  backgroundColor: `${config.color}15`,
                  color: config.color,
                }}
              >
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                <Eye size={10} className="sm:w-3 sm:h-3" />
                {allowFlip ? "คลิกดู Stats" : "คลิกเพื่อดูโปรไฟล์"}
              </span>

              {/* Mini power indicator */}
              {scores && (
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 sm:w-1.5 h-2 sm:h-3 rounded-full"
                      style={{
                        backgroundColor:
                          i <
                          Math.min(5, Math.floor(getTotalPower(scores) / 20))
                            ? config.color
                            : "#e2e8f0",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== BACK SIDE (Stats) ========== */}
        <div
          className={`
            absolute inset-0 w-full
            overflow-hidden rounded-xl sm:rounded-2xl
            bg-slate-50 dark:bg-slate-900
            border border-slate-200 dark:border-slate-700
            shadow-lg
          `}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Top Gradient Bar */}
          <div
            className={`h-1.5 sm:h-2 w-full bg-gradient-to-r ${config.gradient}`}
          />

          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                ⚔️ Battle Stats
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                {name}
              </span>
            </div>

            {scores ? (
              <div className="space-y-1.5 sm:space-y-2">
                <StatBar
                  label="INT"
                  value={scores["INT"] || scores["Openness"] || 0}
                  color="bg-purple-500"
                />
                <StatBar
                  label="VIT"
                  value={scores["VIT"] || scores["Conscientiousness"] || 0}
                  color="bg-yellow-500"
                />
                <StatBar
                  label="STR"
                  value={scores["STR"] || scores["Extraversion"] || 0}
                  color="bg-red-500"
                />
                <StatBar
                  label="FTH"
                  value={scores["FTH"] || scores["Agreeableness"] || 0}
                  color="bg-green-500"
                />
                <StatBar
                  label="DEX"
                  value={scores["DEX"] || scores["Neuroticism"] || 0}
                  color="bg-slate-500"
                />
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">
                <Sparkles size={20} className="mx-auto mb-2 opacity-50" />
                <span className="text-[10px] sm:text-xs">
                  ยังไม่ได้ปลุกพลัง
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(10px) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-30px) scale(1);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 2s ease-out infinite;
        }
      `}</style>
    </div>
  );
}

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const percent = Math.min(100, (value / 20) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] sm:text-[10px] font-bold w-6 sm:w-7 text-slate-400">
        {label}
      </span>
      <div className="flex-1 h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 w-4 text-right">
        {value}
      </span>
    </div>
  );
}

function getTotalPower(scores: { [key: string]: number }): number {
  const keys = [
    "INT",
    "VIT",
    "STR",
    "FTH",
    "DEX",
    "Openness",
    "Conscientiousness",
    "Extraversion",
    "Agreeableness",
    "Neuroticism",
  ];
  let total = 0;
  keys.forEach((k) => {
    if (scores[k]) total += scores[k];
  });
  return total;
}
