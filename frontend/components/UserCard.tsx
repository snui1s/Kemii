"use client";
import { useState, useEffect, CSSProperties } from "react";
import {
  User,
  Flame,
  Wind,
  Mountain,
  Leaf,
  Zap,
  Droplet,
  BarChart3,
} from "lucide-react";

interface UserCardProps {
  name?: string;
  animal?: string;
  type?: string;
  id?: number;
  scores?: { [key: string]: number };
  onInspect?: () => void;
  allowFlip?: boolean; // ✅ 1. เพิ่ม Prop นี้
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
  name = "Unknown",
  animal = "?",
  type = "D",
  id,
  scores,
  onInspect,
  allowFlip = false, // ✅ 2. ค่า Default คือ false (หน้าอื่นจะไม่หมุน)
}: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const generatedParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 100,
        duration: Math.random() * 1000 + 800,
        size: Math.random() * 10 + 10,
        rotation: Math.random() * 360,
      }));
      setParticles(generatedParticles);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // ✅ 3. สร้างฟังก์ชันจัดการ Click แยกตามเงื่อนไข
  const handleClick = () => {
    if (allowFlip) {
      // ถ้าอนุญาตให้หมุน -> ก็หมุน
      setIsFlipped(!isFlipped);
    } else {
      // ถ้าไม่อนุญาต -> ให้ทำงานแบบเดิม (เปิดลิงก์ หรือ Inspect)
      if (onInspect) {
        onInspect();
      } else if (id) {
        window.open(`/result/${id}`, "_blank");
      }
    }
  };

  const getElementConfig = (t: string) => {
    const safeType = t || "D";
    switch (safeType) {
      case "D":
        return {
          color: "#ef4444",
          mainIcon: <Flame className={isHovered ? "animate-bounce" : ""} />,
          particleIcon: <Flame fill="currentColor" />,
          animationName: "rise-up",
        };
      case "I":
        return {
          color: "#eab308",
          mainIcon: <Wind className={isHovered ? "animate-pulse" : ""} />,
          particleIcon: <Wind style={{}} />,
          animationName: "slide-right",
        };
      case "S":
        return {
          color: "#22c55e",
          mainIcon: <Mountain className={isHovered ? "animate-bounce" : ""} />,
          particleIcon: <Leaf fill="currentColor" />,
          animationName: "fall-diagonal",
        };
      case "C":
        return {
          color: "#3b82f6",
          mainIcon: <Droplet className={isHovered ? "animate-pulse" : ""} />,
          particleIcon: <Droplet fill="currentColor" />,
          animationName: "fall-down",
        };
      default:
        return {
          color: "#94a3b8",
          mainIcon: <User />,
          particleIcon: null,
          animationName: "",
        };
    }
  };

  const config = getElementConfig(type);
  const themeColor = config.color;

  return (
    <div
      className="relative w-full h-[120px] sm:h-[140px] cursor-pointer group perspective"
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
        <div
          className={`
            absolute inset-0 w-full h-full backface-hidden
            overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 
            bg-white dark:bg-slate-800 
            border-2 border-slate-200 dark:border-slate-700
            shadow-sm dark:shadow-none
          `}
          style={{
            backfaceVisibility: "hidden",
            borderLeftColor: themeColor,
            borderLeftWidth: isHovered ? "2px" : "6px",
            boxShadow: isHovered
              ? `0 10px 25px -5px ${themeColor}40`
              : undefined,
          }}
        >
          {isHovered &&
            particles.map((p) => {
              let startStyle: CSSProperties = {
                opacity: 0,
                pointerEvents: "none",
                position: "absolute",
                zIndex: 0,
              };
              if (type === "D")
                startStyle = {
                  ...startStyle,
                  bottom: "-20px",
                  left: `${p.left}%`,
                };
              else if (type === "I")
                startStyle = { ...startStyle, left: "-20px", top: `${p.top}%` };
              else
                startStyle = {
                  ...startStyle,
                  top: "-30px",
                  left: `${p.left}%`,
                };

              return (
                <div
                  key={p.id}
                  style={{
                    ...startStyle,
                    color: config.color,
                    animation: `${config.animationName} ${p.duration}ms linear infinite`,
                    animationDelay: `${p.delay}ms`,
                  }}
                >
                  <div style={{ width: p.size, height: p.size, opacity: 0.6 }}>
                    {config.particleIcon}
                  </div>
                </div>
              );
            })}

          <div className="flex items-center justify-between relative z-10 w-full h-full">
            <div className="overflow-hidden pr-2">
              <h3
                style={{ color: isHovered ? themeColor : undefined }}
                className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100 truncate"
              >
                {name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 flex items-center gap-2 truncate">
                <span className="truncate">{animal}</span>
              </p>

              {/* ✅ 5. ถ้า allowFlip ให้โชว์ "คลิกดูพลัง" ถ้าไม่ ให้โชว์ "คลิกดู" เฉยๆ */}
              <p className="text-[10px] sm:text-xs text-slate-400 mt-2 flex items-center gap-1 whitespace-nowrap">
                <Zap size={10} fill="currentColor" />{" "}
                {allowFlip ? "คลิกดูพลัง" : "คลิกเพื่อดู"}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <div
                className="p-2 sm:p-3 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: isHovered
                    ? `${themeColor}40`
                    : `${themeColor}20`,
                  color: themeColor,
                }}
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                  {config.mainIcon}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "-20%",
              right: "-10%",
              width: "150px",
              height: "150px",
              background: `radial-gradient(circle, ${themeColor}30 0%, transparent 70%)`,
              opacity: isHovered ? 0.6 : 0.3,
              pointerEvents: "none",
              filter: "blur(20px)",
              zIndex: 0,
            }}
          />
        </div>
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
            <div className="space-y-2 w-full">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1">
                <span>Elemental Stats</span>
                <BarChart3 size={14} />
              </div>
              <MiniStat color="bg-red-500" value={scores["D"] || 0} label="D" />
              <MiniStat
                color="bg-yellow-400"
                value={scores["I"] || 0}
                label="I"
              />
              <MiniStat
                color="bg-green-500"
                value={scores["S"] || 0}
                label="S"
              />
              <MiniStat
                color="bg-blue-500"
                value={scores["C"] || 0}
                label="C"
              />
            </div>
          ) : (
            <div className="text-center text-xs text-slate-400">
              ไม่มีข้อมูลคะแนน
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
        @keyframes rise-up {
          0% {
            transform: translateY(100px) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-150px) scale(1.2);
            opacity: 0;
          }
        }
        @keyframes slide-right {
          0% {
            transform: translateX(-50px) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.6;
          }
          100% {
            transform: translateX(300px) rotate(10deg);
            opacity: 0;
          }
        }
        @keyframes fall-down {
          0% {
            transform: translateY(-50px);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(200px);
            opacity: 0;
          }
        }
        @keyframes fall-diagonal {
          0% {
            transform: translate(20px, -50px) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(-100px, 200px) rotate(360deg);
            opacity: 0;
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
  const percent = Math.min(100, (value / 40) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold w-3 text-slate-400">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
