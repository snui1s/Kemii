"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  User,
  Wand,
  Shield,
  Sword,
  Heart,
  Skull,
  Sparkles,
  Eye,
  TrendingUp,
  Crown,
  Trash2,
  Briefcase,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

// Dynamically import the radar chart component to reduce initial bundle size
const UserStatsRadar = dynamic(() => import("./UserStatsRadar"), {
  loading: () => (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
      <Sparkles size={20} className="opacity-50 animate-pulse" />
      <span className="text-xs">Loading Stats...</span>
    </div>
  ),
  ssr: false, // Charts are client-side only usually
});

interface UserCardProps {
  name?: string;
  characterClass?: string;
  type?: string;
  id?: string;
  scores?: { [key: string]: number };
  onInspect?: () => void;
  allowFlip?: boolean;
  compactMode?: boolean;
  currentUserRole?: "admin" | "user";
  userRole?: "admin" | "user";
  onPromote?: () => void;
  onDelete?: () => void;
  showFullStats?: boolean;
  departments?: string[];
  isOwnCard?: boolean;
}

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

function normalizeScores(scores?: { [key: string]: number }) {
  if (!scores) return null;
  const normalized: { [key: string]: number } = {
    Openness: 0,
    Conscientiousness: 0,
    Extraversion: 0,
    Agreeableness: 0,
    Neuroticism: 0,
  };
  Object.keys(scores).forEach((key) => {
    const k = key.toLowerCase();
    const val = scores[key] || 0;
    if (k.includes("openness") || k.includes("int")) normalized.Openness = val;
    else if (k.includes("conscientiousness") || k.includes("vit"))
      normalized.Conscientiousness = val;
    else if (k.includes("extraversion") || k.includes("str"))
      normalized.Extraversion = val;
    else if (k.includes("agreeableness") || k.includes("fth"))
      normalized.Agreeableness = val;
    else if (k.includes("neuroticism") || k.includes("dex"))
      normalized.Neuroticism = val;
  });
  return normalized;
}

function getTopStats(scores?: { [key: string]: number }) {
  const normScores = normalizeScores(scores);
  if (!normScores) return [];

  // If all scores are 0, return empty to trigger "Awaiting Awakening"
  const total = Object.values(normScores).reduce((acc, curr) => acc + curr, 0);
  if (total === 0) return [];

  const mapKey: { [key: string]: string } = {
    Openness: "O",
    Conscientiousness: "C",
    Extraversion: "E",
    Agreeableness: "A",
    Neuroticism: "N",
  };
  return Object.entries(normScores)
    .filter(([, val]) => val > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([key]) => ({ key: mapKey[key] || key.charAt(0) }));
}

const ClassHoverEffect = ({ classKey }: { classKey: ClassName }) => {
  const [meteorsLarge, setMeteorsLarge] = useState<
    Array<{ top: string; left: string; delay: string; duration: string }>
  >([]);
  const [meteorsSmall, setMeteorsSmall] = useState<
    Array<{ top: string; left: string; delay: string; duration: string }>
  >([]);

  useEffect(() => {
    setMeteorsLarge(
      Array.from({ length: 4 }).map(() => ({
        top: `${Math.random() * -20}%`,
        left: `${Math.random() * 120 - 10}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${1 + Math.random()}s`,
      }))
    );
    setMeteorsSmall(
      Array.from({ length: 6 }).map(() => ({
        top: `${Math.random() * -50}%`,
        left: `${Math.random() * 120}%`,
        delay: `${Math.random() * 3}s`,
        duration: `${1.5 + Math.random() * 1.5}s`,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (classKey === "Mage") {
    return (
      <>
        {/* Meteor Shower: Large Stream */}
        {meteorsLarge.map((m, i) => (
          <span
            key={`meteor-l-${i}`}
            className="mage-meteor-large"
            style={{
              top: m.top, // Start above
              left: m.left, // Spread across width
              animationDelay: m.delay,
              animationDuration: m.duration,
            }}
          />
        ))}

        {/* Meteor Shower: Small Sparkles */}
        {meteorsSmall.map((m, i) => (
          <span
            key={`meteor-s-${i}`}
            className="mage-meteor-small"
            style={{
              top: m.top,
              left: m.left,
              animationDelay: m.delay,
              animationDuration: m.duration,
            }}
          />
        ))}

        {/* Background Glow Pulse */}
        <div className="mage-glow-pulse" />
      </>
    );
  }

  if (classKey === "Paladin") {
    return (
      <div className="w-full h-full relative">
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={`beam-${i}`}
            className="paladin-light-beam"
            style={{
              left: `${25 + i * 25}%`,
              animationName: "holyBeamShine",
              animationDuration: `${1.5 + i * 0.1}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={`particle-${i}`}
            className="paladin-particle"
            style={{
              left: `${20 + i * 20}%`,
              bottom: `${5 + (i % 3) * 5}%`,
              animationName: "holyParticleRise",
              animationDuration: `${2 + i * 0.1}s`,
              animationTimingFunction: "ease-out",
              animationIterationCount: "infinite",
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (classKey === "Warrior") {
    return (
      <>
        <div
          className="warrior-flame"
          style={{
            animationName: "flameFlicker",
            animationDuration: "2s",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          }}
        />
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={`ember-${i}`}
            className="warrior-ember"
            style={{
              left: `${15 + i * 14}%`,
              bottom: `${5 + (i % 3) * 5}%`,
              animationName: "emberFloat",
              animationDuration: `${1.5 + i * 0.1}s`,
              animationTimingFunction: "ease-out",
              animationIterationCount: "infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </>
    );
  }

  if (classKey === "Cleric") {
    return (
      <>
        {Array.from({ length: 3 }).map((_, i) => (
          <Plus
            key={i}
            size={10 + i * 3}
            className="cleric-heal-icon"
            style={{
              bottom: `${5 + i * 4}%`,
              left: `${20 + i * 30}%`,
              animationName: "floatingHeal",
              animationDuration: `${2 + i * 0.2}s`,
              animationTimingFunction: "ease-out",
              animationIterationCount: "infinite",
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </>
    );
  }

  if (classKey === "Rogue") {
    return (
      <>
        <div className="rogue-shimmer" />
        {Array.from({ length: 2 }).map((_, i) => (
          <span
            key={`dagger-${i}`}
            className="rogue-dagger"
            style={{
              top: `${25 + i * 40}%`,
              left: `${20 + i * 30}%`,
              animationName: "daggerStrike",
              animationDuration: `${1.2 + i * 0.3}s`,
              animationTimingFunction: "ease-out",
              animationIterationCount: "infinite",
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={`smoke-${i}`}
            className="rogue-smoke"
            style={{
              left: `${20 + i * 30}%`,
              bottom: `${10 + (i % 2) * 10}%`,
              width: `${30 + i * 5}px`,
              height: `${30 + i * 5}px`,
              animationName: "smokeDrift",
              animationDuration: `${2 + i * 0.25}s`,
              animationTimingFunction: "ease-out",
              animationIterationCount: "infinite",
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </>
    );
  }

  return null;
};

export default function UserCard({
  name = "Unknown Hero",
  characterClass = "Novice",
  type = "Lv.1",
  id,
  scores,
  onInspect,
  compactMode = false,
  currentUserRole,
  userRole = "user",
  onPromote,
  onDelete,
  departments = [],
  isOwnCard = false,
}: UserCardProps) {
  const router = useRouter();
  
  const classKey = getClassKey(characterClass);
  const config = CLASS_CONFIG[classKey];
  const IconComponent = config.icon;
  
  const normScores = useMemo(() => normalizeScores(scores), [scores]);
  const topStats = useMemo(() => getTopStats(scores), [scores]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (classKey === "Novice" && !isOwnCard) {
      toast.error("คนนี้ยังไม่ได้ปลุกพลังเลย เทียบไม่ได้น้าา", { icon: "✨" });
      return;
    }
    
    if (onInspect) {
      onInspect();
    } else if (id && (isOwnCard || currentUserRole === "admin")) {
      router.push(`/profile?id=${id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative w-full cursor-pointer transition-all duration-300
        border rounded-xl overflow-hidden
        ${isOwnCard 
          ? "bg-[var(--background)] border-[var(--highlight)] shadow-[0_0_15px_rgba(250,129,18,0.15)]" 
          : "bg-white/50 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-[var(--highlight)] hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(250,129,18,0.1)]"
        }
      `}
    >
      <div className="p-5 flex items-start gap-4">
        {/* Icon Box */}
        <div 
          className="shrink-0 p-3 rounded-lg flex items-center justify-center transition-colors"
          style={{ 
            backgroundColor: isOwnCard ? 'var(--highlight)' : 'rgba(0,0,0,0.03)',
            color: isOwnCard ? '#fff' : config.color 
          }}
        >
          <IconComponent size={24} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg text-[var(--foreground)] truncate pr-2">
              {name}
            </h3>
            {userRole === 'admin' && <Crown size={12} className="text-yellow-500 mt-1 shrink-0" />}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1">
             <span className="text-xs font-mono text-[var(--muted)]">{type}</span>
             <span className="text-xs font-mono px-1.5 py-0.5 rounded border border-black/5 dark:border-white/10 text-[var(--muted)]">
               {characterClass}
             </span>
          </div>

          {/* Departments */}
          {departments.length > 0 && (
             <div className="mt-3 flex flex-wrap gap-1">
               {departments.slice(0, 2).map((dept, i) => (
                 <span key={i} className="text-[10px] px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded text-[var(--foreground)] opacity-70 truncate max-w-[100px]">
                   {dept}
                 </span>
               ))}
               {departments.length > 2 && (
                 <span className="text-[10px] px-1.5 py-0.5 text-[var(--muted)]">+{departments.length - 2}</span>
               )}
             </div>
          )}
          
          {/* Stats Preview (Minimal) */}
          <div className="mt-4 flex gap-2">
             {topStats.slice(0, 2).map((stat, i) => (
               <div key={i} className="flex items-center gap-1 text-xs font-bold text-[var(--foreground)] opacity-60">
                 <TrendingUp size={10} />
                 {stat.key}
               </div>
             ))}
          </div>
        
          {/* Admin Actions */}
          {currentUserRole === 'admin' && !compactMode && (
             <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onPromote?.(); }} className="p-1.5 hover:bg-yellow-100 rounded text-yellow-600">
                  <Crown size={14} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="p-1.5 hover:bg-red-100 rounded text-red-500">
                  <Trash2 size={14} />
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
