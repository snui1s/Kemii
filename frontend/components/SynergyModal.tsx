"use client";
import { useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Swords, // ดาบไขว้ (VS)
  Handshake, // จับมือ (Good Synergy)
  Scroll,
  Sparkles,
  Zap,
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
  character_class: string; // ใช้ class แทน animal
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

  const renderBulletList = (text: string) => {
    if (!text) return null;
    // Clean text และแสดงผล
    return (
      <div className="text-slate-300 text-sm leading-relaxed space-y-2">
        <p>{text.replace(/\*\*/g, "").replace(/-/g, "• ")}</p>
      </div>
    );
  };

  const getClassIcon = (cls: string) => {
    const c = (cls || "").toLowerCase();
    if (c.includes("mage"))
      return <Wand size={32} className="text-purple-400" />;
    if (c.includes("paladin"))
      return <Shield size={32} className="text-amber-400" />;
    if (c.includes("warrior"))
      return <Sword size={32} className="text-red-400" />;
    if (c.includes("cleric"))
      return <Heart size={32} className="text-emerald-400" />;
    if (c.includes("rogue"))
      return <Skull size={32} className="text-slate-400" />;
    return <UserIcon size={32} className="text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      {/* Container: Ancient Stone Tablet Style */}
      <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative border border-slate-700/50">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white z-20 bg-slate-800/50 rounded-full p-2 transition-colors hover:bg-red-500/20"
        >
          <X size={20} />
        </button>

        {loading ? (
          // --- 🔮 Loading: Summoning Circle ---
          <div className="h-[450px] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900"></div>

            <div className="relative z-10 flex flex-col items-center gap-8">
              {/* Magic Circle Animation */}
              <div className="relative w-40 h-40">
                {/* Outer Ring */}
                <div className="absolute inset-0 border-2 border-dashed border-indigo-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                {/* Inner Ring */}
                <div className="absolute inset-4 border-2 border-indigo-400/50 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>

                {/* Core Energy */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles
                    size={48}
                    className="text-indigo-400 animate-pulse"
                  />
                </div>

                {/* Floating Runes */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-indigo-300 animate-bounce">
                  ⚡
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-indigo-300 animate-bounce delay-100">
                  🔥
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse">
                  Casting Soul Link...
                </h3>
                <p className="text-slate-500 text-xs tracking-widest uppercase">
                  Reading Fate & Destiny
                </p>
              </div>
            </div>
          </div>
        ) : (
          // --- 📜 Result: Ancient Scroll ---
          data && (
            <div>
              {/* Header: Synergy Name */}
              <div className="bg-slate-950 p-8 text-center relative border-b border-slate-800">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>

                <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 relative z-10 drop-shadow-md">
                  {data.ai_analysis.synergy_name}
                </h2>

                <div className="flex items-center justify-center gap-2 mt-3">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      data.ai_analysis.synergy_score > 80
                        ? "bg-green-900/30 text-green-400 border-green-500/30"
                        : "bg-yellow-900/30 text-yellow-400 border-yellow-500/30"
                    }`}
                  >
                    Resonance Rate: {data.ai_analysis.synergy_score}%
                  </div>
                </div>
              </div>

              {/* Arena: User vs User */}
              <div className="flex justify-between items-center p-6 bg-slate-900 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

                {/* Left User */}
                <div className="text-center w-1/3 relative z-10">
                  <div className="flex justify-center mb-3">
                    <div className="p-4 bg-slate-800 rounded-full border border-slate-700 shadow-lg shadow-indigo-900/20">
                      {getClassIcon(data.user1.character_class)}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-200 text-sm">
                    {data.user1.name}
                  </h3>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {data.user1.character_class}
                  </span>
                </div>

                {/* VS Icon */}
                <div className="text-slate-600">
                  {data.ai_analysis.synergy_score > 80 ? (
                    <Handshake
                      size={32}
                      className="text-green-500 animate-pulse"
                    />
                  ) : (
                    <Swords size={32} className="text-red-500 animate-pulse" />
                  )}
                </div>

                {/* Right User */}
                <div className="text-center w-1/3 relative z-10">
                  <div className="flex justify-center mb-3">
                    <div className="p-4 bg-slate-800 rounded-full border border-slate-700 shadow-lg shadow-purple-900/20">
                      {getClassIcon(data.user2.character_class)}
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-200 text-sm">
                    {data.user2.name}
                  </h3>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {data.user2.character_class}
                  </span>
                </div>
              </div>

              {/* Content: Analysis Scroll */}
              <div className="p-8 bg-slate-900/50 space-y-6">
                {/* Analysis Box */}
                <div className="relative">
                  <div className="absolute -left-3 top-0 bottom-0 w-1 bg-slate-700 rounded-full"></div>
                  <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2 text-sm uppercase tracking-widest">
                    <Scroll size={16} /> Oracle's Insight
                  </h4>
                  <div className="pl-2">
                    {data && renderBulletList(data.ai_analysis.analysis)}
                  </div>
                </div>

                {/* Pro Tip Box (Quest Hint) */}
                <div className="bg-slate-800/50 border border-amber-500/20 p-4 rounded-xl flex gap-3 items-start">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="font-bold text-amber-400 text-xs uppercase mb-1">
                      Guild Master's Advice
                    </h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {data.ai_analysis.pro_tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
