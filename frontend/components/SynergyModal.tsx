"use client";
import { useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Swords,
  Handshake,
  Scroll,
  Sparkles,
  Wand,
  Shield,
  Sword,
  Heart,
  Skull,
  User as UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";

interface SynergyModalProps {
  myId: number;
  partnerId: number;
  onClose: () => void;
}

interface UserBase {
  id: number;
  name: string;
  character_class: string;
  level: number;
}

interface AIAnalysis {
  synergy_score: number;
  synergy_name: string;
  analysis: string;
  pro_tip: string;
}

interface SynergyData {
  user1: UserBase;
  user2: UserBase;
  ai_analysis: AIAnalysis;
  team_rating: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SynergyModal({
  myId,
  partnerId,
  onClose,
}: SynergyModalProps) {
  const {
    data,
    isLoading: loading,
    error,
  } = useQuery<SynergyData>({
    queryKey: ["synergy", myId, partnerId],
    queryFn: async () => {
      const res = await axios.post(`${API_URL}/match-ai`, {
        user1_id: myId,
        user2_id: partnerId,
      });
      return res.data;
    },
    enabled: !!myId && !!partnerId,
    retry: false,
  });

  useEffect(() => {
    if (error) {
      toast.error("การเชื่อมต่อวิญญาณล้มเหลว... ลองใหม่ภายหลัง");
    }
  }, [error]);

  // ปิด Modal เมื่อกด ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const getClassIcon = (cls: string, size: number = 24) => {
    const c = (cls || "").toLowerCase();
    if (c.includes("mage"))
      return (
        <Wand size={size} className="text-purple-500 dark:text-purple-400" />
      );
    if (c.includes("paladin"))
      return (
        <Shield size={size} className="text-amber-500 dark:text-amber-400" />
      );
    if (c.includes("warrior"))
      return <Sword size={size} className="text-red-500 dark:text-red-400" />;
    if (c.includes("cleric"))
      return (
        <Heart size={size} className="text-emerald-500 dark:text-emerald-400" />
      );
    if (c.includes("rogue"))
      return <Skull size={size} className="text-blue-600 dark:text-blue-400" />;
    return (
      <UserIcon size={size} className="text-gray-500 dark:text-gray-400" />
    );
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/30 dark:bg-slate-950/30 backdrop-blur-md animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Container */}
      <div className="bg-white dark:bg-slate-900 w-[calc(100%-1rem)] sm:w-full max-w-sm sm:max-w-lg rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden relative border border-slate-200 dark:border-slate-700/50 max-h-[85vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white z-20 bg-slate-100 dark:bg-slate-800/50 rounded-full p-1.5 sm:p-2 transition-colors hover:bg-red-100 dark:hover:bg-red-500/20"
        >
          <X size={18} className="sm:w-5 sm:h-5" />
        </button>

        {loading ? (
          // --- Loading ---
          <div className="h-[300px] sm:h-[350px] flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-transparent">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-100 dark:from-indigo-900/20 via-slate-50 dark:via-slate-900 to-slate-50 dark:to-slate-900" />

            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36">
                <div className="absolute inset-0 border-2 border-dashed border-indigo-300 dark:border-indigo-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-3 sm:inset-4 border-2 border-indigo-400 dark:border-indigo-400/50 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles
                    size={36}
                    className="sm:w-12 sm:h-12 text-indigo-500 dark:text-indigo-400 animate-pulse"
                  />
                </div>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 dark:from-indigo-400 to-purple-600 dark:to-purple-400 animate-pulse">
                  Casting Soul Link...
                </h3>
                <p className="text-slate-500 text-[10px] sm:text-xs tracking-widest uppercase">
                  Reading Fate & Destiny
                </p>
              </div>
            </div>
          </div>
        ) : data ? (
          // --- Result ---
          <div>
            {/* Header */}
            <div className="bg-slate-100 dark:bg-slate-950/20 p-4 sm:p-6 text-center relative border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base sm:text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 dark:from-amber-200 via-yellow-500 dark:via-yellow-400 to-amber-600 relative z-10 px-2">
                {data.ai_analysis.synergy_name}
              </h2>

              <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3">
                <div
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${
                    data.team_rating === "Excellent"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30"
                      : data.team_rating === "Good"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-300 dark:border-green-500/30"
                      : data.team_rating === "Acceptable"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/30"
                      : data.team_rating === "Risky"
                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/30"
                      : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/30"
                  }`}
                >
                  {data.team_rating} ({data.ai_analysis.synergy_score}%)
                </div>
              </div>
            </div>

            {/* Arena */}
            <div className="flex justify-between items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
              {/* User 1 */}
              <div className="text-center w-2/5 relative z-10">
                <div className="flex justify-center mb-2">
                  <div className="p-2 sm:p-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                    {getClassIcon(data.user1.character_class, 18)}
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] sm:text-sm truncate max-w-[80px] sm:max-w-full mx-auto">
                  {data.user1.name}
                </h3>
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase">
                  {data.user1.character_class}
                </span>
              </div>

              {/* VS Icon */}
              <div className="w-1/5 flex justify-center">
                {data.team_rating === "Excellent" ||
                data.team_rating === "Good" ? (
                  <Handshake
                    size={20}
                    className="sm:w-6 sm:h-6 text-green-500 animate-pulse"
                  />
                ) : (
                  <Swords
                    size={20}
                    className="sm:w-6 sm:h-6 text-red-500 animate-pulse"
                  />
                )}
              </div>

              {/* User 2 */}
              <div className="text-center w-2/5 relative z-10">
                <div className="flex justify-center mb-2">
                  <div className="p-2 sm:p-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                    {getClassIcon(data.user2.character_class, 18)}
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] sm:text-sm truncate max-w-[80px] sm:max-w-full mx-auto">
                  {data.user2.name}
                </h3>
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase">
                  {data.user2.character_class}
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-5 bg-white dark:bg-slate-900/50 space-y-3 sm:space-y-4">
              {/* Insight */}
              <div className="relative pl-2 sm:pl-3">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-wider">
                  <Scroll size={12} className="sm:w-4 sm:h-4" /> Oracle's
                  Insight
                </h4>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] sm:text-sm leading-relaxed break-words">
                  {data.ai_analysis.analysis}
                </p>
              </div>

              {/* Pro Tip */}
              <div className="bg-amber-50 dark:bg-slate-800/50 border border-amber-200 dark:border-amber-500/20 p-2.5 sm:p-4 rounded-lg sm:rounded-xl flex gap-2 items-start">
                <span className="text-base sm:text-lg shrink-0">💡</span>
                <div className="min-w-0">
                  <h4 className="font-bold text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs uppercase mb-0.5">
                    Guild Master's Advice
                  </h4>
                  <p className="text-amber-800 dark:text-slate-400 text-[11px] sm:text-sm leading-relaxed break-words">
                    {data.ai_analysis.pro_tip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
