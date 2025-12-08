"use client";
import { useState, useEffect, CSSProperties } from "react";
import { User, Flame, Wind, Mountain, Leaf, Zap, Droplet } from "lucide-react";

interface UserCardProps {
  name: string;
  animal: string;
  type: string;
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

export default function UserCard({ name, animal, type }: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // 1. Logic เดิม: Pre-calculate particles
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

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Logic เดิม: Config ของธาตุ
  const getElementConfig = (t: string) => {
    switch (t) {
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-300
        bg-white dark:bg-slate-800 
        border-2 border-slate-200 dark:border-slate-700
        shadow-sm dark:shadow-none
      `}
      style={{
        borderLeftColor: themeColor,
        borderLeftWidth: isHovered ? "2px" : "6px",

        borderTopColor: isHovered ? themeColor : undefined,
        borderRightColor: isHovered ? themeColor : undefined,
        borderBottomColor: isHovered ? themeColor : undefined,

        transform: isHovered
          ? "translateY(-5px) scale(1.02)"
          : "translateY(0) scale(1)",
        boxShadow: isHovered ? `0 10px 25px -5px ${themeColor}40` : undefined, // ให้ ClassName จัดการเงาปกติ
      }}
    >
      <style jsx>{`
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

      {/* Particles Logic (เหมือนเดิมเป๊ะ) */}
      {isHovered &&
        particles.map((p) => {
          let startStyle: CSSProperties = {
            opacity: 0,
            pointerEvents: "none",
            position: "absolute",
            zIndex: 0,
          };

          if (type === "D") {
            startStyle = { ...startStyle, bottom: "-20px", left: `${p.left}%` };
          } else if (type === "I") {
            startStyle = { ...startStyle, left: "-20px", top: `${p.top}%` };
          } else {
            startStyle = { ...startStyle, top: "-30px", left: `${p.left}%` };
          }

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

      <div className="flex items-center justify-between relative z-10">
        <div>
          <h3
            style={{
              color: isHovered ? themeColor : undefined, // ถ้าไม่ Hover ให้ใช้สีจาก Class
              transition: "color 0.2s",
            }}
            // ✅ เพิ่ม dark:text-slate-100
            className="font-bold text-lg text-slate-800 dark:text-slate-100"
          >
            {name}
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            {animal}
            <span
              style={{
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? "translateX(0)" : "translateX(-10px)",
                transition: "all 0.3s ease",
                color: themeColor,
              }}
              className="text-xs font-semibold flex items-center gap-1"
            >
              • <Zap size={12} /> คลิกเพื่อส่อง
            </span>
          </p>
        </div>

        <div
          style={{
            backgroundColor: isHovered ? `${themeColor}40` : `${themeColor}20`,
            color: themeColor,
            transition: "all 0.3s",
            padding: "12px",
            borderRadius: "50%",
            boxShadow: isHovered ? `0 0 15px ${themeColor}40` : "none",
          }}
        >
          {config.mainIcon}
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
          transition: "all 0.5s",
          pointerEvents: "none",
          filter: "blur(20px)",
          zIndex: 0,
        }}
      />
    </div>
  );
}
