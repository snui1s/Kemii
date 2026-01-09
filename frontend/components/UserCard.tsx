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
  id?: number;
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
  allowFlip = false,
  compactMode = false,
  currentUserRole,
  userRole = "user",
  onPromote,
  onDelete,
  showFullStats = false,
  isOwnCard = false,
  departments = [],
}: UserCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      left: number;
      top: number;
      delay: number;
      size: number;
    }>
  >([]);

  const classKey = getClassKey(characterClass);
  const config = CLASS_CONFIG[classKey];
  const IconComponent = config.icon;

  const normScores = useMemo(() => normalizeScores(scores), [scores]);
  const topStats = useMemo(() => getTopStats(scores), [scores]);

  useEffect(() => {
    setIsMounted(true);
    setParticles(
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: Math.random() * 80 + 10,
        top: Math.random() * 80 + 10,
        delay: Math.random() * 2000,
        size: Math.random() * 4 + 2,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isNovice = classKey === "Novice";

    // 1. Block Novice Comparison/View (unless it's me)
    if (isNovice && !isOwnCard) {
      toast.error("คนนี้ยังไม่ได้ปลุกพลังเลย เทียบไม่ได้น้าา", {
        icon: "✨",
        style: {
          borderRadius: "12px",
          background: "#334155",
          color: "#fff",
        },
      });
      return;
    }

    // 2. Perform Action
    if (allowFlip && !compactMode) {
      setIsFlipped(!isFlipped);
    } else if (onInspect) {
      // Synergy/Comparison is allowed for everyone!
      onInspect();
    } else if (id) {
      // Visiting full profile page is restricted to Admin or Me
      if (isOwnCard || currentUserRole === "admin") {
        router.push(`/profile?id=${id}`);
      }
    }
  };

  const chartData = useMemo(
    () =>
      normScores
        ? [
            { subject: "O", A: normScores.Openness, fullMark: 50 },
            { subject: "C", A: normScores.Conscientiousness, fullMark: 50 },
            { subject: "E", A: normScores.Extraversion, fullMark: 50 },
            { subject: "A", A: normScores.Agreeableness, fullMark: 50 },
            { subject: "N", A: normScores.Neuroticism, fullMark: 50 },
          ]
        : [],
    [normScores]
  );

  const cardHeight = compactMode ? "160px" : "240px";

  if (!isMounted)
    return (
      <div
        className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
        style={{ height: cardHeight }}
      />
    );

  return (
    <div
      className="relative w-full group user-card cursor-pointer"
      style={{ perspective: "1000px", height: cardHeight }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div
        className="relative w-full h-full transition-all duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className={`absolute inset-0 w-full h-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl ${
            isHovered ? config.glow : ""
          } transition-all duration-300 flex flex-col`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* --- Effects Wrapper (Clipped) --- */}
          <div className="absolute inset-0 w-full h-full overflow-hidden rounded-xl pointer-events-none z-0">
            <div
              className={`h-1.5 w-full bg-gradient-to-r ${config.gradient} shrink-0 relative z-20`}
            />

            <div className="absolute -right-6 -bottom-6 opacity-[0.15] dark:opacity-[0.2] transform rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-500 z-0">
              <IconComponent size={140} color={config.color} />
            </div>

            <div className="effect-layer">
              {isHovered && <ClassHoverEffect classKey={classKey} />}
            </div>

            {classKey === "Novice" &&
              isHovered &&
              particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute pointer-events-none animate-float-up"
                  style={{
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    color: config.color,
                    animationDelay: `${p.delay}ms`,
                    zIndex: 1,
                  }}
                >
                  <Sparkles size={p.size} className="opacity-60" />
                </div>
              ))}
          </div>

          <div className="p-5 flex-1 flex flex-col relative z-10">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl shrink-0 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 shadow-sm"
                style={{
                  backgroundColor: `${config.color}15`,
                  color: config.color,
                }}
              >
                <IconComponent className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm tracking-wide"
                    style={{ backgroundColor: config.color }}
                  >
                    {characterClass}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {type}
                  </span>
                  {userRole === "admin" && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-yellow-600 bg-yellow-100 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                      <Crown size={8} fill="currentColor" /> GOD
                    </span>
                  )}
                </div>
                {departments.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 opacity-90 relative z-30">
                    {departments.slice(0, 3).map((dept, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        <Briefcase size={10} className="shrink-0" />
                        <span className="truncate max-w-[120px]">{dept}</span>
                      </div>
                    ))}
                    {departments.length > 3 && (
                      <div className="relative group/tooltip">
                        <div className="flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 cursor-help font-medium">
                          <span>+{departments.length - 3} more</span>
                        </div>

                        {/* Cool Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] hidden group-hover/tooltip:block z-50">
                          <div className="bg-slate-800 text-white text-[10px] rounded-lg py-2 px-3 shadow-xl border border-slate-700 flex flex-col gap-1 relative animate-in fade-in zoom-in-95 duration-200">
                            {/* Arrow */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-slate-700"></div>

                            {departments.slice(3).map((dept, idx) => (
                              <span
                                key={idx}
                                className="border-b border-slate-700 last:border-0 pb-1 last:pb-0"
                              >
                                {dept}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4">
              {showFullStats && normScores ? (
                <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex flex-col items-center">
                      <span className="text-purple-600 font-bold">
                        {normScores.Openness}
                      </span>
                      <span className="text-[9px] text-slate-400">O</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-blue-600 font-bold">
                        {normScores.Conscientiousness}
                      </span>
                      <span className="text-[9px] text-slate-400">C</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-amber-600 font-bold">
                        {normScores.Extraversion}
                      </span>
                      <span className="text-[9px] text-slate-400">E</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-emerald-600 font-bold">
                        {normScores.Agreeableness}
                      </span>
                      <span className="text-[9px] text-slate-400">A</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-rose-600 font-bold">
                        {normScores.Neuroticism}
                      </span>
                      <span className="text-[9px] text-slate-400">N</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topStats.length > 0 ? (
                    topStats.map((stat, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
                      >
                        <TrendingUp size={12} className="text-emerald-500" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          High {stat.key}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-dashed border-slate-200 w-full justify-center">
                      <Sparkles size={12} /> <span>Awaiting Awakening...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!compactMode && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  {allowFlip && (
                    <>
                      <Eye size={12} /> Click for Stats
                    </>
                  )}
                </span>

                {/* Admin Controls */}
                {currentUserRole === "admin" && (
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPromote?.();
                      }}
                      title={
                        userRole === "admin"
                          ? "Demote to User"
                          : "Promote to Admin"
                      }
                      className={`p-1.5 rounded-full transition-colors ${
                        userRole === "admin"
                          ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                      }`}
                    >
                      <Crown
                        size={14}
                        fill={userRole === "admin" ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.();
                      }}
                      title="Delete User"
                      className="p-1.5 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {allowFlip && !compactMode && (
          <div
            className="absolute inset-0 w-full h-full overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div
              className={`h-1.5 w-full bg-gradient-to-r ${config.gradient} shrink-0`}
            />
            <div className="flex-1 flex flex-col p-2 relative z-10">
              <div className="flex items-center justify-between px-3 pb-2 border-b border-slate-200 dark:border-slate-700 shrink-0 mt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp size={12} /> Battle Stats
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {name}
                </span>
              </div>
              <div className="flex-1 w-full min-h-0 relative mt-1">
                {/* Only render Chart if flipped to save resources, or we can use the Dynamic import with ssr:false */}
                {isFlipped && (
                  <UserStatsRadar
                    name={name}
                    chartData={chartData}
                    config={config}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
