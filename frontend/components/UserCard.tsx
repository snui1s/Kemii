"use client";
import { useState, CSSProperties } from "react";
import {
  User,
  Flame,
  Droplets,
  Wind,
  Mountain,
  Leaf,
  Zap,
  Droplet,
} from "lucide-react";

interface UserCardProps {
  name: string;
  animal: string;
  type: string; // D, I, S, C
}

interface Particle {
  id: number;
  left: number; // ตำแหน่งเริ่มแกน X
  top: number; // ตำแหน่งเริ่มแกน Y (สำหรับลม/ไฟ)
  delay: number;
  duration: number;
  size: number; // ขนาดไอคอน
  rotation: number;
}

export default function UserCard({ name, animal, type }: UserCardProps) {
  // 1. สร้าง State เพื่อจับว่าเมาส์จ่ออยู่ไหม
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (particles.length === 0) {
      const generatedParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100, // สุ่มตำแหน่งแนวนอน 0-100%
        top: Math.random() * 100, // สุ่มตำแหน่งแนวตั้ง 0-100% (ใช้สำหรับลม)
        delay: Math.random() * 1000,
        duration: Math.random() * 2000 + 1500, // ช้าลงหน่อยจะได้เห็นชัด
        size: Math.random() * 10 + 10, // ขนาด 10-20px
        rotation: Math.random() * 360,
      }));
      setParticles(generatedParticles);
    }
  };

  const handleMouseLeave = () => setIsHovered(false);

  // 2. Config แยกตามธาตุ (สี, ไอคอนเม็ดฝน, ท่าอนิเมชั่น)
  const getElementConfig = (t: string) => {
    switch (t) {
      case "D": // 🔥 ไฟ: ลอยขึ้นจากข้างล่าง
        return {
          color: "#ef4444",
          mainIcon: <Flame className={isHovered ? "animate-bounce" : ""} />,
          particleIcon: <Flame fill="currentColor" />, // ใช้ Icon เป็นเม็ดฝน
          animationName: "rise-up",
        };
      case "I": // 💨 ลม: พัดจากขวาไปซ้าย
        return {
          color: "#eab308",
          mainIcon: <Wind className={isHovered ? "animate-pulse" : ""} />,
          particleIcon: <Wind style={{ transform: "scaleX(-1)" }} />,
          animationName: "slide-left",
        };
      case "S": // 🍃 ดิน: ใบไม้ร่วงเฉียงซ้าย
        return {
          color: "#22c55e",
          mainIcon: <Mountain className={isHovered ? "animate-bounce" : ""} />,
          particleIcon: <Leaf fill="currentColor" />,
          animationName: "fall-diagonal",
        };
      case "C": // 💧 น้ำ: หยดลงแนวดิ่ง
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

  const getElementColor = (t: string) => {
    switch (t) {
      case "D":
        return "#ef4444"; // Red-500
      case "I":
        return "#eab308"; // Yellow-500
      case "S":
        return "#22c55e"; // Green-500
      case "C":
        return "#3b82f6"; // Blue-500
      default:
        return "#94a3b8"; // Slate-400
    }
  };

  // 3. ฟังก์ชันเลือกไอคอน
  const getIcon = (t: string) => {
    switch (t) {
      case "D":
        return <Flame className={isHovered ? "animate-bounce" : ""} />;
      case "I":
        return <Wind className={isHovered ? "animate-pulse" : ""} />;
      case "S":
        return <Mountain className={isHovered ? "animate-bounce" : ""} />;
      case "C":
        return <Droplets className={isHovered ? "animate-pulse" : ""} />;
      default:
        return <User />;
    }
  };

  const themeColor = getElementColor(type);

  return (
    <div
      // --- Pure JS Events ---
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // --- Pure JS Styles (ทำงานแน่นอน) ---
      style={{
        cursor: "pointer",
        transition: "all 0.3s ease-out", // อนิเมชั่นนุ่มๆ
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "20px",
        border: isHovered
          ? `2px solid ${themeColor}` // จ่อ: ขอบสีธาตุ
          : "2px solid #e2e8f0", // ปกติ: ขอบเทาจางๆ
        transform: isHovered
          ? "translateY(-5px) scale(1.02)" // จ่อ: ลอยขึ้น + ขยาย
          : "translateY(0) scale(1)",
        boxShadow: isHovered
          ? `0 10px 25px -5px ${themeColor}40` // จ่อ: เงาสีธาตุ (ใส่ 40 คือโปร่งแสง)
          : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        borderLeft: isHovered
          ? `2px solid ${themeColor}`
          : `6px solid ${themeColor}`, // ปกติ: เงาธรรมดา
      }}
      className="relative overflow-hidden" // เก็บไว้แค่จัด layout พื้นฐาน
    >
      <style jsx>{`
        @keyframes rise-up {
          /* ไฟ: ลอยขึ้น */
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
        @keyframes slide-left {
          /* ลม: ขวาไปซ้าย */
          0% {
            transform: translateX(50px) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.6;
          }
          100% {
            transform: translateX(-300px) rotate(-10deg);
            opacity: 0;
          }
        }
        @keyframes fall-down {
          /* น้ำ: ดิ่งลง */
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
          /* ดิน: เฉียงซ้าย + หมุน */
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

      {/* --- 4. Render Particles --- */}
      {isHovered &&
        particles.map((p) => {
          // คำนวณตำแหน่งเริ่มต้น (Start Position) ตามธาตุ
          let startStyle: CSSProperties = {
            opacity: 0,
            pointerEvents: "none",
            position: "absolute",
            zIndex: 0,
          };

          if (type === "D") {
            // ไฟ: เริ่มข้างล่าง
            startStyle = { ...startStyle, bottom: "-20px", left: `${p.left}%` };
          } else if (type === "I") {
            // ลม: เริ่มขวาสุด (กระจายแนวตั้ง)
            startStyle = { ...startStyle, right: "-20px", top: `${p.top}%` };
          } else {
            // น้ำ & ดิน: เริ่มข้างบน
            startStyle = { ...startStyle, top: "-30px", left: `${p.left}%` };
          }

          return (
            <div
              key={p.id}
              style={{
                ...startStyle,
                color: config.color, // สีตามธาตุ
                // Animation
                animation: `${config.animationName} ${p.duration}ms linear infinite`,
                animationDelay: `${p.delay}ms`,
              }}
            >
              {/* เรนเดอร์ Icon แทน div สี่เหลี่ยม */}
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
              color: isHovered ? themeColor : "#1e293b", // จ่อ: ชื่อเปลี่ยนสีตามธาตุ
              transition: "color 0.2s",
            }}
            className="font-bold text-lg"
          >
            {name}
          </h3>

          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            {animal}
            {/* แสดงสถานะเมื่อ Hover */}
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

        {/* กล่องไอคอน */}
        <div
          style={{
            // ปกติ: สีพื้นหลังจางๆ (20% opacity)
            // Hover: สีเข้มขึ้น (40% opacity)
            backgroundColor: isHovered ? `${themeColor}40` : `${themeColor}20`,
            color: themeColor,
            transition: "all 0.3s",
            padding: "12px",
            borderRadius: "50%",
            boxShadow: isHovered ? `0 0 15px ${themeColor}40` : "none",
          }}
        >
          {getIcon(type)}
        </div>
      </div>
      {/* (แถม) พื้นหลัง Effect จางๆ เวลา Hover */}
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "150px",
          height: "150px",
          background: `radial-gradient(circle, ${themeColor}30 0%, transparent 70%)`,
          opacity: isHovered ? 0.6 : 0.3, // แสดงตลอดเวลาแต่จางๆ พุ่งขึ้นตอน Hover
          transition: "all 0.5s",
          pointerEvents: "none",
          filter: "blur(20px)",
          zIndex: 0,
        }}
      />
    </div>
  );
}
