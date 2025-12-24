import { useState, useEffect, useMemo } from "react";
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
  Plus,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface UserCardProps {
  name?: string;
  characterClass?: string;
  type?: string;
  id?: number;
  scores?: { [key: string]: number };
  onInspect?: () => void;
  allowFlip?: boolean;
  compactMode?: boolean;
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
  if (classKey === "Mage") {
    return (
      <>
        {/* Meteor Shower: Large Stream */}
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={`meteor-l-${i}`}
            className="mage-meteor-large"
            style={{
              top: `${Math.random() * -20}%`, // Start above
              left: `${Math.random() * 120 - 10}%`, // Spread across width
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random()}s`,
            }}
          />
        ))}

        {/* Meteor Shower: Small Sparkles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={`meteor-s-${i}`}
            className="mage-meteor-small"
            style={{
              top: `${Math.random() * -50}%`,
              left: `${Math.random() * 120}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1.5 + Math.random() * 1.5}s`,
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
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={`beam-${i}`}
            className="paladin-light-beam"
            style={{
              left: `${15 + i * 18}%`,
              animationName: "holyBeamShine",
              animationDuration: `${1.5 + i * 0.1}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={`particle-${i}`}
            className="paladin-particle"
            style={{
              left: `${10 + i * 10}%`,
              bottom: `${5 + (i % 4) * 5}%`,
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
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={`ember-${i}`}
            className="warrior-ember"
            style={{
              left: `${8 + i * 7}%`,
              bottom: `${5 + (i % 6) * 5}%`,
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
        {Array.from({ length: 5 }).map((_, i) => (
          <Plus
            key={i}
            size={10 + i * 3}
            className="cleric-heal-icon"
            style={{
              bottom: `${5 + i * 4}%`,
              left: `${15 + i * 15}%`,
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
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={`dagger-${i}`}
            className="rogue-dagger"
            style={{
              top: `${15 + i * 20}%`,
              left: `${10 + i * 15}%`,
              animationName: "daggerStrike",
              animationDuration: `${1.2 + i * 0.3}s`,
              animationTimingFunction: "ease-out",
              animationIterationCount: "infinite",
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={`smoke-${i}`}
            className="rogue-smoke"
            style={{
              left: `${10 + i * 12}%`,
              bottom: `${10 + (i % 4) * 10}%`,
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
}: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const classKey = getClassKey(characterClass);
  const config = CLASS_CONFIG[classKey];
  const IconComponent = config.icon;

  const normScores = useMemo(() => normalizeScores(scores), [scores]);
  const topStats = useMemo(() => getTopStats(scores), [scores]);

  const particles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: Math.random() * 80 + 10,
        top: Math.random() * 80 + 10,
        delay: Math.random() * 2000,
        size: Math.random() * 4 + 2,
      })),
    []
  );

  useEffect(() => setIsMounted(true), []);

  const handleClick = () => {
    if (allowFlip && !compactMode) setIsFlipped(!isFlipped);
    else if (onInspect) onInspect();
    else if (id) window.location.href = `/assessment/result/${id}`;
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
      className="relative w-full cursor-pointer group user-card"
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
          className={`absolute inset-0 w-full h-full overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl ${
            isHovered ? config.glow : ""
          } transition-all duration-300 flex flex-col`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div
            className={`h-1.5 w-full bg-gradient-to-r ${config.gradient} shrink-0 relative z-20`}
          />

          <div className="absolute -right-6 -bottom-6 opacity-[0.15] dark:opacity-[0.2] transform rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-500 z-0">
            <IconComponent size={140} color={config.color} />
          </div>

          <div className="effect-layer">
            <ClassHoverEffect classKey={classKey} />
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
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4">
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
            </div>

            {!compactMode && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Eye size={12} />{" "}
                  {allowFlip ? "Click for Stats" : "View Profile"}
                </span>
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
                {normScores ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="65%"
                      data={chartData}
                    >
                      <PolarGrid stroke="#94a3b8" strokeOpacity={0.2} />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{
                          fill: "#64748b",
                          fontSize: 9,
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
                        name={name}
                        dataKey="A"
                        stroke={config.color}
                        strokeWidth={2}
                        fill={config.color}
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Sparkles size={20} className="opacity-50" />
                    <span className="text-xs">No Stats Data</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .user-card {
          position: relative;
          overflow: hidden;
        }
        .effect-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          z-index: 5;
        }
        .user-card:hover .effect-layer {
          opacity: 1;
        }

        /* --- Mage Meteor Shower (Enhanced) --- */
        .mage-meteor-large {
          position: absolute;
          width: 3px;
          height: 80px; /* Long tail */
          background: linear-gradient(180deg, rgba(168, 85, 247, 0) 0%, rgba(168, 85, 247, 1) 50%, #fff 100%);
          border-radius: 50% 50% 2px 2px;
          opacity: 0;
          filter: drop-shadow(0 0 5px #d8b4fe);
          transform: rotate(20deg); /* Angle of fall */
          animation: meteorFall ease-in infinite;
          z-index: 5;
        }

        .mage-meteor-small {
          position: absolute;
          width: 1.5px;
          height: 40px;
          background: linear-gradient(180deg, rgba(192, 132, 252, 0) 0%, rgba(192, 132, 252, 0.8) 100%);
          opacity: 0;
          transform: rotate(20deg);
          animation: meteorFall ease-in infinite;
          z-index: 4;
        }

        .mage-glow-pulse {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 30%, rgba(168, 85, 247, 0.2), transparent 70%);
          animation: glowPulse 3s ease-in-out infinite;
          z-index: 1;
        }

        @keyframes meteorFall {
          0% {
            transform: translateY(-50px) translateX(0px) rotate(20deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(300px) translateX(-50px) rotate(20deg); /* Fall down and slightly left */
            opacity: 0;
          }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        .paladin-light-beam {
          position: absolute;
          width: 2px;
          height: 100%;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(234, 179, 8, 0.8) 30%,
            rgba(255, 215, 0, 0.6) 50%,
            transparent 100%
          );
          filter: blur(1px);
          box-shadow: 0 0 20px rgba(234, 179, 8, 0.8);
        }
        .paladin-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #ffd700;
          border-radius: 50%;
          box-shadow: 0 0 10px #ffd700, 0 0 20px #eab308;
        }
        @keyframes holyBeamShine {
          0% {
            opacity: 0;
            transform: translateY(-100%) scaleY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(0%) scaleY(1);
          }
          100% {
            opacity: 0;
            transform: translateY(100%) scaleY(0);
          }
        }
        @keyframes holyParticleRise {
          0% {
            transform: translateY(20px) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
            transform: translateY(-50px) scale(1);
          }
          100% {
            transform: translateY(-120px) scale(0.5);
            opacity: 0;
          }
        }

        .warrior-flame {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to top,
            rgba(239, 68, 68, 0.4) 0%,
            rgba(220, 38, 38, 0.3) 30%,
            rgba(239, 68, 68, 0.2) 60%,
            transparent 100%
          );
          mix-blend-mode: screen;
        }
        .warrior-ember {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 10px #ef4444, 0 0 20px #dc2626;
        }
        .warrior-slash {
          position: absolute;
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #ef4444, transparent);
          transform-origin: center;
          filter: drop-shadow(0 0 5px #ef4444);
        }
        @keyframes flameFlicker {
          0%, 100% {
            transform: scaleY(1) translateY(0);
            opacity: 0.8;
          }
          50% {
            transform: scaleY(1.1) translateY(-5px);
            opacity: 1;
          }
        }
        @keyframes emberFloat {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) translateX(30px) scale(0.2);
            opacity: 0;
          }
        }
        @keyframes slashEffect {
          0% {
            transform: translateX(-50px) rotate(-45deg) scaleX(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
            transform: translateX(0) rotate(-45deg) scaleX(1);
          }
          100% {
            transform: translateX(50px) rotate(-45deg) scaleX(0);
            opacity: 0;
          }
        }

        .cleric-heal-icon {
          position: absolute;
          color: #22c55e;
          filter: drop-shadow(0 0 5px #22c55e);
          opacity: 0;
        }
        @keyframes floatingHeal {
          0% {
            transform: translateY(20px) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-80px) scale(1.2);
            opacity: 0;
          }
        }

        .rogue-shimmer {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(30, 58, 95, 0.3) 25%,
            rgba(15, 23, 42, 0.5) 50%,
            rgba(30, 58, 95, 0.3) 75%,
            transparent 100%
          );
          background-size: 200% 200%;
          animation: shimmerWave 3s ease-in-out infinite;
        }
        .rogue-dagger {
          position: absolute;
          width: 20px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #1e3a8a, #3b82f6, transparent);
          filter: drop-shadow(0 0 8px #3b82f6);
          transform-origin: left center;
        }
        .rogue-smoke {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(30, 58, 95, 0.6), transparent);
          filter: blur(8px);
        }
        @keyframes shimmerWave {
          0% {
            background-position: 0% 0%;
            opacity: 0.4;
          }
          50% {
            background-position: 100% 100%;
            opacity: 0.8;
          }
          100% {
            background-position: 0% 0%;
            opacity: 0.4;
          }
        }
        @keyframes daggerStrike {
          0% {
            transform: translateX(-30px) translateY(-30px) rotate(45deg) scale(0);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateX(80px) translateY(80px) rotate(45deg) scale(1);
            opacity: 0;
          }
        }
        @keyframes smokeDrift {
          0% {
            transform: translate(0, 0) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translate(50px, -80px) scale(1.5);
            opacity: 0;
          }
        }

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
