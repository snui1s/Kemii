"use client";
import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Crown,
  X,
  ExternalLink,
  Zap,
  AlertCircle,
  Scroll,
  Sword,
  Shield,
  Map,
  Sparkles,
  Brain,
  Heart,
  Ghost,
  RefreshCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import UserCard from "@/components/UserCard";
import ElementalLoader from "@/components/ElementalLoader";
import AuthGuard from "@/components/AuthGuard";
import ThemeBackground from "@/components/ThemeBackground";

// --- Interfaces ---
interface User {
  id: number;
  name: string;
  character_class: string; // รับค่า character_class จาก backend
  dominant_type: string; // Lv.
  scores?: { [key: string]: number }; // OCEAN Scores
  is_available: boolean;
  active_project_end_date?: string;
}

interface Member extends User {
  role?: string;
}

interface TeamResult {
  leader: User;
  members: Member[];
  reason: string;
  team_name: string;
  log_id?: number;
  strategy: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ⚔️ RPG Strategy Mapping (แปลไทย)
const RPG_STRATEGIES: Record<
  string,
  { name: string; icon: any; desc: string; color: string }
> = {
  Balanced: {
    name: "⚖️ สมดุลผู้กล้า",
    icon: Users,
    desc: "สมดุลทุกด้านดั่งปาร์ตี้ผู้กล้าในตำนาน (All-Rounder)",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  },
  Aggressive: {
    name: "⚔️ กองหน้าบ้าเลือด",
    icon: Sword,
    desc: "เน้นพลังโจมตี บุกทะลวงงานให้จบไว (High Extraversion)",
    color: "text-red-400 border-red-500/30 bg-red-500/10",
  },
  Creative: {
    name: "🔮 ภูมิปัญญาเวทมนตร์",
    icon: Zap,
    desc: "เน้นไอเดียใหม่ๆ และการพลิกแพลง (High Openness)",
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  },
  Supportive: {
    name: "🛡️ กำแพงพิทักษ์",
    icon: Shield,
    desc: "เน้นการป้องกัน สนับสนุน และความละเอียด (High Conscientiousness)",
    color: "text-green-400 border-green-500/30 bg-green-500/10",
  },
};

const STRATEGIES = Object.keys(RPG_STRATEGIES);

export default function BuildTeamPage() {
  // Config State
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [memberCount, setMemberCount] = useState(2);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Result State
  const [allResults, setAllResults] = useState<
    Record<string, TeamResult | null>
  >({});
  const [activeStrategy, setActiveStrategy] = useState<string>("Balanced");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Query Data
  const { data: roster = [], refetch: refetchRoster } = useQuery<User[]>({
    queryKey: ["users", "roster"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/users/roster`);
      return res.data;
    },
  });

  const { data: userDetailRaw, isLoading: loadingDetail } = useQuery<User>({
    queryKey: ["user", viewingUser?.id],
    queryFn: async () => {
      if (!viewingUser?.id) throw new Error("No ID");
      const res = await axios.get(`${API_URL}/users/${viewingUser.id}`);
      return res.data;
    },
    enabled: !!viewingUser?.id,
    retry: false,
  });

  const userDetail = userDetailRaw || viewingUser;
  const availableCount = roster.filter((u) => u.is_available).length;
  const maxMemberCount = Math.max(1, availableCount - 1);

  // --- Handlers ---
  const handleRecommendAll = async () => {
    if (!selectedLeaderId) return toast.error("กรุณาเลือกผู้นำปาร์ตี้ก่อน!");
    const currentAvailable = roster.filter(
      (u) => u.is_available && u.id !== Number(selectedLeaderId)
    ).length;
    if (memberCount > currentAvailable)
      return toast.error(`นักผจญภัยว่างไม่พอ! เหลือแค่ ${currentAvailable} คน`);

    setLoading(true);
    setAllResults({});

    const promises = STRATEGIES.map(async (strategy) => {
      try {
        const res = await axios.post<TeamResult>(
          `${API_URL}/recommend-team-members`,
          {
            leader_id: Number(selectedLeaderId),
            member_count: memberCount,
            strategy: strategy,
          }
        );
        return { ...res.data, strategy };
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(promises);
    const resultMap: Record<string, TeamResult | null> = {};
    results.forEach((res) => {
      if (res) resultMap[res.strategy] = res;
    });
    setAllResults(resultMap);
    setLoading(false);
    toast.success("Guild Master วางแผนการรบเรียบร้อย!");
  };

  const handleConfirm = async () => {
    const targetResult = allResults[activeStrategy];
    if (!targetResult) return;
    if (!startDate || !endDate)
      return toast.error("ระบุวันเริ่มและสิ้นสุดภารกิจก่อน!");

    try {
      if (targetResult.log_id) {
        await axios.post(`${API_URL}/confirm-team`, {
          log_id: targetResult.log_id,
          start_date: startDate,
          end_date: endDate,
        });
      } else {
        const memberIds = targetResult.members.map((m) => m.id);
        await axios.post(`${API_URL}/confirm-team`, {
          team_name: targetResult.team_name,
          member_ids: [targetResult.leader.id, ...memberIds],
        });
      }
      toast.success(`ปาร์ตี้ "${targetResult.team_name}" ออกเดินทางแล้ว!`);
      setAllResults({});
      setSelectedLeaderId("");
      setStartDate("");
      setEndDate("");
      refetchRoster();
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleReset = async () => {
    if (confirm("ต้องการเรียกตัวฮีโร่กลับกิลด์ทั้งหมดหรือไม่? (ล้างสถานะ)")) {
      await axios.post(`${API_URL}/reset-teams`);
      refetchRoster();
      toast.success("เรียกตัวนักผจญภัยกลับโรงเตี๊ยมเรียบร้อย!");
      setAllResults({});
      setSelectedLeaderId("");
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen p-4 md:p-8 text-slate-800 dark:text-slate-200 font-sans relative overflow-hidden">
        {/* 🌌 Background */}
        <ThemeBackground />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* --- LEFT PANEL: Quest Board (Config) --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg border border-indigo-200 dark:border-indigo-500/40">
                  <Map
                    className="text-indigo-600 dark:text-indigo-400"
                    size={24}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">
                    กระดานภารกิจ
                  </h2>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">
                    ศูนย์บัญชาการกิลด์
                  </p>
                </div>
              </div>

              {/* Alert No Heroes */}
              {availableCount === 0 && roster.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                    <AlertCircle size={16} /> โรงเตี๊ยมว่างเปล่า!
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ฮีโร่ทุกคนออกไปทำภารกิจหมดแล้ว
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-2 w-full py-2 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold border border-red-200 dark:border-red-500/20 transition flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={14} /> เรียกตัวกลับทั้งหมด
                  </button>
                </div>
              )}

              {/* 1. Select Leader */}
              <div className="mb-5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  1. เลือกผู้นำปาร์ตี้ (Leader)
                </label>
                <div className="relative group">
                  <select
                    className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer transition-all text-sm group-hover:bg-slate-100 dark:group-hover:bg-slate-950/80"
                    value={selectedLeaderId}
                    onChange={(e) => setSelectedLeaderId(e.target.value)}
                  >
                    <option value="">-- อัญเชิญหัวหน้า --</option>
                    {roster.map((u) => {
                      const isBusy = !u.is_available;
                      return (
                        <option
                          key={u.id}
                          value={u.id}
                          disabled={isBusy}
                          className="bg-white dark:bg-slate-900"
                        >
                          {u.name} ({u.character_class}){" "}
                          {isBusy ? "🔴 ติดภารกิจ" : "🟢 พร้อมลุย"}
                        </option>
                      );
                    })}
                  </select>
                  <Crown
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* 2. Party Size */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    2. ขนาดปาร์ตี้ (สมาชิก)
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    สูงสุด: {maxMemberCount}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setMemberCount(Math.max(1, memberCount - 1))}
                    disabled={memberCount <= 1}
                    className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {memberCount}{" "}
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-sans">
                      คน
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setMemberCount(Math.min(maxMemberCount, memberCount + 1))
                    }
                    disabled={memberCount >= maxMemberCount}
                    className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 3. Timeline */}
              <div className="mb-8">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                  <Scroll size={14} /> ระยะเวลาภารกิจ
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                      เริ่ม
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-12 pr-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-300 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                      สิ้นสุด
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-12 pr-3 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-300 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Summon Button */}
              <button
                onClick={handleRecommendAll}
                disabled={loading || !selectedLeaderId || availableCount <= 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group border border-indigo-400/30"
              >
                {loading ? (
                  <span className="animate-pulse">
                    กำลังปรึกษาเทพพยากรณ์...
                  </span>
                ) : (
                  <>
                    <Sparkles size={18} className="group-hover:animate-spin" />{" "}
                    ปรึกษาเทพพยากรณ์ (AI)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* --- RIGHT PANEL: Battle Plans (Result) --- */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                <ElementalLoader />
              </div>
            ) : Object.keys(allResults).length === 0 ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800">
                <div className="p-6 bg-slate-200 dark:bg-slate-800/50 rounded-full mb-4">
                  <Map
                    size={48}
                    className="text-slate-400 dark:text-slate-700"
                  />
                </div>
                <p className="text-lg font-medium text-slate-500">
                  แผนที่ยังว่างเปล่า
                </p>
                <p className="text-sm text-slate-600">
                  ตั้งค่าภารกิจทางซ้ายเพื่อเริ่มการวิเคราะห์
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                {/* Formation Tabs */}
                <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-xl overflow-x-auto border border-slate-200 dark:border-slate-800 no-scrollbar">
                  {STRATEGIES.map((strat) => {
                    const isActive = activeStrategy === strat;
                    const hasData = !!allResults[strat];
                    const config = RPG_STRATEGIES[strat];
                    return (
                      <button
                        key={strat}
                        onClick={() => setActiveStrategy(strat)}
                        disabled={!hasData}
                        className={`
                         flex-1 px-4 py-3 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2
                         ${
                           isActive
                             ? `bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-lg border border-slate-200 dark:border-slate-600`
                             : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800/50"
                         }
                         ${!hasData && "opacity-30 cursor-not-allowed"}
                       `}
                      >
                        <config.icon size={16} /> {config.name}
                      </button>
                    );
                  })}
                </div>

                {/* Active Formation Card */}
                {allResults[activeStrategy] ? (
                  <div className="animate-fade-in">
                    {/* Formation Header */}
                    <div
                      className={`bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-xl mb-6 relative overflow-hidden group`}
                    >
                      {/* Ambient Glow */}
                      <div
                        className={`absolute top-0 right-0 p-20 opacity-10 blur-[80px] rounded-full ${
                          RPG_STRATEGIES[activeStrategy].color
                            .replace("text-", "bg-")
                            .split(" ")[0]
                        }`}
                      ></div>

                      <div className="relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                          <div>
                            <div
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border ${RPG_STRATEGIES[activeStrategy].color}`}
                            >
                              {RPG_STRATEGIES[activeStrategy].name}
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-tight">
                              {allResults[activeStrategy]?.team_name}
                            </h2>
                          </div>
                          <button
                            onClick={handleConfirm}
                            className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-500/30"
                          >
                            <Scroll size={18} /> ลงนามสัญญา (ยืนยัน)
                          </button>
                        </div>

                        {/* Strategy Description */}
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                            📜 คำแนะนำจากกุนซือ:
                          </span>
                          {allResults[activeStrategy]?.reason}
                        </div>
                      </div>
                    </div>

                    {/* Team Roster Grid */}
                    <div className="space-y-6">
                      {/* Leader Section */}
                      <div>
                        <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2 pl-1">
                          <Crown size={14} /> หัวหน้าปาร์ตี้ (Leader)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <UserCard
                            name={
                              allResults[activeStrategy]?.leader?.name ||
                              "Unknown"
                            }
                            characterClass={
                              allResults[activeStrategy]?.leader
                                ?.character_class || "?"
                            }
                            type={
                              allResults[activeStrategy]?.leader
                                ?.dominant_type || "Lv.1"
                            }
                            scores={allResults[activeStrategy]?.leader?.scores}
                            allowFlip={true}
                            onInspect={() => {
                              if (allResults[activeStrategy]?.leader)
                                setViewingUser(
                                  allResults[activeStrategy]!.leader
                                );
                            }}
                          />
                        </div>
                      </div>

                      {/* Members Section */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 pl-1">
                          <Users size={14} /> สหายร่วมศึก (Companions)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {allResults[activeStrategy]?.members?.map((m, i) => (
                            <UserCard
                              key={
                                m.id
                                  ? `m-${m.id}-${activeStrategy}`
                                  : `idx-${i}`
                              }
                              name={m.name || "Unknown"}
                              characterClass={m.character_class || "?"}
                              type={m.dominant_type || "Lv.1"}
                              scores={m.scores}
                              allowFlip={true}
                              onInspect={() => setViewingUser(m)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-red-400/50">
                    ไม่สามารถอ่านนิมิตในเส้นเวลานี้ได้...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* --- Profile Modal (Character Sheet) --- */}
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <Scroll
                    className="text-indigo-600 dark:text-indigo-400"
                    size={18}
                  />
                  ข้อมูลฮีโร่
                </h3>
                <div className="flex gap-2">
                  <a
                    href={`/assessment/result/${viewingUser.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button
                    onClick={() => setViewingUser(null)}
                    className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto max-h-[70vh]">
                {loadingDetail ? (
                  <div className="flex justify-center py-10">
                    <ElementalLoader />
                  </div>
                ) : userDetail ? (
                  <div className="space-y-6">
                    <div className="flex justify-center transform hover:scale-105 transition-transform duration-500">
                      <div className="w-full max-w-xs">
                        <UserCard
                          name={userDetail.name}
                          characterClass={userDetail.character_class}
                          type={userDetail.dominant_type}
                          scores={userDetail.scores}
                          allowFlip={true}
                        />
                      </div>
                    </div>

                    {/* ✅ Stats Breakdown */}
                    {userDetail.scores && (
                      <div className="bg-white dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
                          <Zap className="text-yellow-500" size={14} />{" "}
                          ค่าสถานะต่อสู้ (Battle Stats)
                        </h4>
                        <div className="space-y-4">
                          <StatBar
                            label="INT (Openness)"
                            value={userDetail.scores["Openness"] || 0}
                            color="bg-purple-500"
                            icon={<Brain size={12} />}
                          />
                          <StatBar
                            label="VIT (Conscientiousness)"
                            value={userDetail.scores["Conscientiousness"] || 0}
                            color="bg-yellow-500"
                            icon={<Shield size={12} />}
                          />
                          <StatBar
                            label="STR (Extraversion)"
                            value={userDetail.scores["Extraversion"] || 0}
                            color="bg-red-500"
                            icon={<Sword size={12} />}
                          />
                          <StatBar
                            label="FTH (Agreeableness)"
                            value={userDetail.scores["Agreeableness"] || 0}
                            color="bg-green-500"
                            icon={<Heart size={12} />}
                          />
                          <StatBar
                            label="DEX (Neuroticism)"
                            value={userDetail.scores["Neuroticism"] || 0}
                            color="bg-slate-500"
                            icon={<Ghost size={12} />}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-red-500">
                    ไม่พบข้อมูลฮีโร่ในฐานข้อมูล
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

// ✨ Component ย่อย (StatBar) - Minimal RPG Style
function StatBar({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  const percent = Math.min(100, Math.max(5, (value / 20) * 100)); // เทียบเต็ม 20
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          {icon} {label}
        </span>
        <span>{value} / 20</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-300 dark:border-slate-700">
        <div
          className={`h-full rounded-full ${color} shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
