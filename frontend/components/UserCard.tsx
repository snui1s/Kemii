"use client";
import { useState, useEffect, CSSProperties } from "react";
import {
  User,
  Wand, // Mage
  Shield, // Paladin
  Sword, // Warrior
  Heart, // Cleric
  Skull, // Rogue
  Zap,
  BarChart3,
  Sparkles,
  Crosshair,
} from "lucide-react";

interface UserCardProps {
  name?: string;
  animal?: string; // ใช้รับชื่อ Class (เช่น "Mage", "Paladin")
  type?: string; // ใช้รับ Level (เช่น "Lv.5")
  id?: number;
  scores?: { [key: string]: number }; // รับค่าพลัง INT, VIT, STR...
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
  rotation: number;
}

export default function UserCard({
  name = "Unknown Hero",
  animal = "Novice", // รับ Class Name
  type = "Lv.1", // รับ Level string
  id,
  scores,
  onInspect,
  allowFlip = false,
}: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // สร้างละอองเวทมนตร์ (Particles)
    const generatedParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 100,
      duration: Math.random() * 1000 + 1500,
      size: Math.random() * 6 + 4,
      rotation: Math.random() * 360,
    }));
    setParticles(generatedParticles);
  }, []);

  const handleClick = () => {
    if (allowFlip) {
      setIsFlipped(!isFlipped);
    } else {
      if (onInspect) {
        onInspect();
      } else if (id) {
        window.location.href = `/assessment/result/${id}`;
      }
    }
  };

  // 🛡️ Logic เลือกธีมตามอาชีพ RPG
  const getClassConfig = (className: string) => {
    // ป้องกัน Case Sensitive
    const safeClass = (className || "").trim();

    if (safeClass.includes("Mage") || safeClass.includes("เวทย์")) {
      return {
        color: "#a855f7", // Purple
        bgGradient: "from-purple-500/10 to-indigo-500/10",
        border: "border-purple-200 dark:border-purple-800",
        mainIcon: <Wand className={isHovered ? "animate-pulse" : ""} />,
        particleIcon: <Sparkles size={10} />,
        animationName: "float-up",
      };
    }
    if (safeClass.includes("Paladin") || safeClass.includes("อัศวิน")) {
      return {
        color: "#eab308", // Yellow/Amber
        bgGradient: "from-yellow-500/10 to-orange-500/10",
        border: "border-yellow-200 dark:border-yellow-800",
        mainIcon: <Shield className={isHovered ? "animate-bounce" : ""} />,
        particleIcon: <Shield size={8} />,
        animationName: "pulse-glow",
      };
    }
    if (safeClass.includes("Warrior") || safeClass.includes("นักรบ")) {
      return {
        color: "#ef4444", // Red
        bgGradient: "from-red-500/10 to-orange-500/10",
        border: "border-red-200 dark:border-red-800",
        mainIcon: <Sword className={isHovered ? "animate-wiggle" : ""} />,
        particleIcon: <Crosshair size={10} />,
        animationName: "rise-fast",
      };
    }
    if (safeClass.includes("Cleric") || safeClass.includes("นักบวช")) {
      return {
        color: "#22c55e", // Green
        bgGradient: "from-green-500/10 to-emerald-500/10",
        border: "border-green-200 dark:border-green-800",
        mainIcon: <Heart className={isHovered ? "animate-pulse" : ""} />,
        particleIcon: <Heart size={8} />,
        animationName: "float-gentle",
      };
    }
    if (safeClass.includes("Rogue") || safeClass.includes("โจร")) {
      return {
        color: "#94a3b8", // Slate
        bgGradient: "from-slate-500/10 to-gray-500/10",
        border: "border-slate-200 dark:border-slate-700",
        mainIcon: <Skull className={isHovered ? "animate-pulse" : ""} />,
        particleIcon: <Skull size={8} />,
        animationName: "fade-move",
      };
    }

    // Default (Novice)
    return {
      color: "#64748b",
      bgGradient: "from-gray-500/5 to-slate-500/5",
      border: "border-slate-200 dark:border-slate-700",
      mainIcon: <User />,
      particleIcon: <Sparkles size={6} />,
      animationName: "float-gentle",
    };
  };

  const config = getClassConfig(animal);
  const themeColor = config.color;

  return (
    <div
      className="relative w-full h-[140px] cursor-pointer group perspective"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{ perspective: "1000px" }}
    >
      <div
        className={`relative w-full h-full transition-all duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* --- FRONT SIDE --- */}
        <div
          className={`
            absolute inset-0 w-full h-full backface-hidden
            overflow-hidden rounded-2xl p-4
            bg-white dark:bg-slate-900 
            bg-gradient-to-br ${config.bgGradient}
            border-2 ${config.border}
            shadow-sm hover:shadow-md transition-all
          `}
          style={{
            backfaceVisibility: "hidden",
            borderTopColor: isHovered ? themeColor : undefined,
            borderRightColor: isHovered ? themeColor : undefined,
            borderBottomColor: isHovered ? themeColor : undefined,
            borderLeftColor: isHovered ? themeColor : undefined,
          }}
        >
          {/* Particles FX */}
          {isHovered &&
            particles.map((p) => (
              <div
                key={p.id}
                className="absolute pointer-events-none opacity-0"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  color: themeColor,
                  animation: `${config.animationName} ${p.duration}ms linear infinite`,
                  animationDelay: `${p.delay}ms`,
                }}
              >
                {config.particleIcon}
              </div>
            ))}

          <div className="flex flex-col justify-between h-full relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3
                  style={{ color: isHovered ? themeColor : undefined }}
                  className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate transition-colors"
                >
                  {name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {animal}
                  </span>
                  <span className="text-[10px] text-slate-400">{type}</span>
                </div>
              </div>

              {/* Class Icon Badge */}
              <div
                className="p-3 rounded-full transition-all duration-300 shadow-inner"
                style={{
                  backgroundColor: isHovered
                    ? `${themeColor}20`
                    : `${themeColor}10`,
                  color: themeColor,
                }}
              >
                {config.mainIcon}
              </div>
            </div>

            <div className="flex justify-between items-end">
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Zap size={10} fill="currentColor" />{" "}
                {allowFlip ? "คลิกดูสเตตัส" : "คลิกเพื่อดู"}
              </p>
            </div>
          </div>
        </div>

        {/* --- BACK SIDE (STATS) --- */}
        <div
          className={`
            absolute inset-0 w-full h-full backface-hidden
            rounded-2xl p-4
            bg-slate-50 dark:bg-slate-900 
            border-2 border-slate-200 dark:border-slate-700
            flex flex-col justify-center
          `}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {scores ? (
            <div className="space-y-1.5 w-full">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1 border-b border-slate-200 dark:border-slate-700 pb-1">
                <span>Battle Stats</span>
                <BarChart3 size={12} />
              </div>

              {/* Stats Bar */}
              <MiniStat
                label="INT"
                value={scores["INT"] || scores["Openness"] || 0}
                color="bg-purple-500"
              />
              <MiniStat
                label="VIT"
                value={scores["VIT"] || scores["Conscientiousness"] || 0}
                color="bg-yellow-500"
              />
              <MiniStat
                label="STR"
                value={scores["STR"] || scores["Extraversion"] || 0}
                color="bg-red-500"
              />
              <MiniStat
                label="FTH"
                value={scores["FTH"] || scores["Agreeableness"] || 0}
                color="bg-green-500"
              />
              <MiniStat
                label="DEX"
                value={scores["DEX"] || scores["Neuroticism"] || 0}
                color="bg-slate-500"
              />
            </div>
          ) : (
            <div className="text-center flex flex-col items-center gap-2 text-slate-400">
              <Sparkles size={24} className="opacity-50" />
              <span className="text-xs">ยังไม่ปลุกพลัง</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .perspective {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        @keyframes float-up {
          0% {
            transform: translateY(20px) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-40px) scale(1.2);
            opacity: 0;
          }
        }
        @keyframes pulse-glow {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        @keyframes rise-fast {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          100% {
            transform: translateY(-50px);
            opacity: 0.7;
          }
        }
        @keyframes float-gentle {
          0% {
            transform: translateY(10px) rotate(0deg);
            opacity: 0;
          }
          100% {
            transform: translateY(-30px) rotate(10deg);
            opacity: 0.6;
          }
        }
        @keyframes fade-move {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translate(10px, -20px);
            opacity: 0;
          }
        }
        .animate-wiggle {
          animation: wiggle 1s ease-in-out infinite;
        }
        @keyframes wiggle {
          0%,
          100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }
      `}</style>
    </div>
  );
}

function MiniStat({
  color,
  value,
  label,
}: {
  color: string;
  value: number;
  label: string;
}) {
  // สมมติคะแนนเต็ม 20 (ตามระบบ OCEAN ใหม่) ถ้าเป็นระบบเก่า 100 ก็ปรับตัวหาร
  const percent = Math.min(100, (value / 20) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold w-5 text-slate-400">{label}</span>
      <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
