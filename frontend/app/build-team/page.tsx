"use client";
import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Save,
  RefreshCcw,
  Crown,
  X,
  ExternalLink,
  Flame,
  Wind,
  Mountain,
  Droplets,
  Zap,
  AlertCircle,
  CalendarDays,
  LayoutGrid,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import UserCard from "@/components/UserCard";
import ElementalLoader from "@/components/ElementalLoader";
import AuthGuard from "@/components/AuthGuard";

// --- Interfaces ---
interface User {
  id: number;
  name: string;
  animal: string;
  dominant_type: string;
  scores?: { [key: string]: number };
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
const STRATEGIES = ["Balanced", "Aggressive", "Creative", "Supportive"];

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

  // ✅ 1. Use Query for Roster
  const { data: roster = [], refetch: refetchRoster } = useQuery<User[]>({
    queryKey: ["users", "roster"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/users/roster`);
      return res.data;
    },
  });

  // ✅ 2. Use Query for User Detail (Modal)
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

  // Fallback to viewingUser if detail fetch fails or is not yet available
  // Note: logic slightly changed from strictly catching error to fall back,
  // but if fetch fails, userDetailRaw is undefined.
  // We can just use userDetailRaw || viewingUser
  const userDetail = userDetailRaw || viewingUser;

  // คำนวณจำนวนลูกน้องสูงสุด (นับเฉพาะคนที่ว่าง)
  const availableCount = roster.filter((u) => u.is_available).length;
  const maxMemberCount = Math.max(1, availableCount - 1);

  // ฟังก์ชันแปลงวันที่ให้สวยงาม
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  // 2. สั่ง AI หาคน
  const handleRecommendAll = async () => {
    if (!selectedLeaderId) {
      toast.error("เลือกหัวหน้าทีมก่อนครับ!", {
        id: "leader-error",
      });
      return;
    }

    // เช็คคนว่างจริงๆ (ไม่นับคนติดงาน และไม่นับหัวหน้าที่เลือกไปแล้ว)
    const currentAvailable = roster.filter(
      (u) => u.is_available && u.id !== Number(selectedLeaderId)
    ).length;

    if (memberCount > currentAvailable) {
      toast.error(`คนว่างไม่พอครับ! เหลือคนว่างงานแค่ ${currentAvailable} คน`, {
        id: "member-error",
      });
      return;
    }

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
        console.error(`Error fetching ${strategy}:`, error);
        return null;
      }
    });

    try {
      const results = await Promise.all(promises);
      const resultMap: Record<string, TeamResult | null> = {};
      let successCount = 0;

      results.forEach((res) => {
        if (res) {
          resultMap[res.strategy] = res;
          successCount++;
        }
      });

      setAllResults(resultMap);

      if (successCount > 0) {
        toast.success(`AI วิเคราะห์ครบ ${successCount} รูปแบบเรียบร้อย!`, {
          id: "success",
        });
      } else {
        toast.error("AI ประมวลผลล้มเหลว ลองใหม่อีกครั้งครับ", {
          id: "error",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ", {
        id: "connection-error",
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. บันทึกทีมจริง
  const handleConfirm = async () => {
    const targetResult = allResults[activeStrategy];
    if (!targetResult) return;

    if (!startDate || !endDate) {
      toast.error("กรุณาระบุวันเริ่มและวันจบโปรเจกต์ (ช่องซ้ายมือ)", {
        id: "date-error",
      });
      return;
    }

    try {
      if (targetResult.log_id) {
        await axios.post(`${API_URL}/confirm-team`, {
          log_id: targetResult.log_id,
          start_date: startDate,
          end_date: endDate,
        });
      } else {
        // Fallback
        const memberIds = targetResult.members.map((m) => m.id);
        await axios.post(`${API_URL}/confirm-team`, {
          team_name: targetResult.team_name,
          member_ids: [targetResult.leader.id, ...memberIds],
        });
      }

      toast.success(`บันทึกทีม "${targetResult.team_name}" เรียบร้อย!`);

      // Reset
      setAllResults({});
      setSelectedLeaderId("");
      setStartDate("");
      setEndDate("");
      refetchRoster();
    } catch (err) {
      console.error(err);
      toast.error("บันทึกไม่สำเร็จ", {
        id: "confirm-error",
      });
    }
  };

  // 4. Reset
  const handleReset = async () => {
    if (confirm("ล้างทีมทั้งหมด? ทุกคนจะกลับมาว่างงานนะ")) {
      try {
        await axios.post(`${API_URL}/reset-teams`);
        refetchRoster();
        toast.success("ล้างกระดานเรียบร้อย!");
        setAllResults({});
        setSelectedLeaderId("");
      } catch (err) {
        console.error(err);
        toast.error("Reset ไม่สำเร็จ", {
          id: "reset-error",
        });
      }
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800 p-6 pb-20 transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-900 dark:text-slate-100">
          {/* --- LEFT PANEL: Config --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors relative lg:sticky lg:top-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <UserPlus className="text-blue-600 dark:text-blue-400" /> Create
                Team
              </h2>

              {/* Alert คนหมด */}
              {availableCount === 0 && roster.length > 0 && (
                <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold">
                    <AlertCircle size={20} /> ไม่มีคนว่างเลย!
                  </div>
                  <p className="text-sm text-slate-500">
                    ทุกคนติดภารกิจหมดแล้ว
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-2 w-full py-2 bg-orange-100 dark:bg-orange-800/40 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-bold hover:bg-orange-200 transition"
                  >
                    <RefreshCcw size={14} className="inline mr-1" />{" "}
                    ล้างทีมทั้งหมด
                  </button>
                </div>
              )}

              {/* ✅ 1. เลือกหัวหน้าทีม (UX ปรับปรุง) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  1. เลือกหัวหน้าทีม (Leader)
                </label>

                <div className="relative">
                  <select
                    className="w-full p-3 pl-4 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-blue-500 dark:text-white cursor-pointer transition-all disabled:opacity-50 text-base"
                    value={selectedLeaderId}
                    onChange={(e) => setSelectedLeaderId(e.target.value)}
                  >
                    <option value="">-- เลือกพนักงาน --</option>

                    {roster.map((u) => {
                      const isBusy = !u.is_available;
                      // ข้อความแสดงสถานะ
                      const statusText = isBusy
                        ? `🔴 ติดภารกิจ (ว่าง ${formatDate(
                            u.active_project_end_date
                          )})`
                        : `🟢 ว่าง`;

                      const fullLabel = `${u.name} (${u.animal}) — ${statusText}`;
                      const displayLabel = truncateText(fullLabel, 50);

                      return (
                        <option
                          key={u.id}
                          value={u.id}
                          disabled={isBusy} // 🔒 ล็อคคนไม่ว่าง
                          className={
                            isBusy
                              ? "text-slate-400 bg-slate-100 dark:bg-slate-800"
                              : "text-slate-800 font-medium dark:text-slate-300"
                          }
                        >
                          {displayLabel}
                        </option>
                      );
                    })}
                  </select>

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Users size={18} />
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 ml-1 flex items-center gap-1">
                  <Lock size={10} /> คนที่มี 🔴 คือติดโปรเจกต์อยู่ (เลือกไม่ได้)
                </p>
              </div>

              {/* 2. จำนวนลูกน้อง */}
              <div className="mb-6">
                <label className="flex justify-between items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <span>2. ต้องการลูกน้องกี่คน?</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    (ว่างสูงสุด {maxMemberCount} คน)
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setMemberCount(Math.max(1, memberCount - 1))}
                    disabled={memberCount <= 1}
                    className="w-10 h-10 rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold w-8 text-center">
                    {memberCount}
                  </span>
                  <button
                    onClick={() =>
                      setMemberCount(Math.min(maxMemberCount, memberCount + 1))
                    }
                    disabled={memberCount >= maxMemberCount}
                    className="w-10 h-10 rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800 mb-6" />

              {/* 3. Date Picker */}
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <CalendarDays size={18} className="text-blue-500" />{" "}
                  ระยะเวลาโครงการ
                </label>

                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <span className="text-xs font-bold">START</span>
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full pl-16 p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <span className="text-xs font-bold">END</span>
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full pl-16 p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleRecommendAll}
                disabled={loading || !selectedLeaderId || availableCount <= 0}
                className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>กำลังวิเคราะห์ 4 กลยุทธ์...</>
                ) : (
                  <>
                    <LayoutGrid size={20} /> วิเคราะห์ทุกรูปแบบทีม
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-400 mt-2">
                *AI จะคำนวณ 4 รูปแบบพร้อมกัน
              </p>
            </div>
          </div>

          {/* --- RIGHT PANEL: Result --- */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
                <ElementalLoader />
                <p className="mt-6 text-slate-500 dark:text-slate-400 animate-pulse font-medium">
                  AI กำลังจำลองทีมทั้ง 4 รูปแบบ...
                </p>
              </div>
            ) : Object.keys(allResults).length === 0 ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 transition-colors">
                <Users size={64} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">ตั้งค่าโครงการด้านซ้าย</p>
                <p className="text-sm opacity-70">
                  เพื่อเริ่มวิเคราะห์ทีมที่เหมาะสมที่สุด
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                {/* Strategy Tabs */}
                <div className="flex flex-wrap gap-2 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl overflow-x-auto">
                  {STRATEGIES.map((strat) => {
                    const isActive = activeStrategy === strat;
                    const hasData = !!allResults[strat];
                    return (
                      <button
                        key={strat}
                        onClick={() => setActiveStrategy(strat)}
                        disabled={!hasData}
                        className={`
                         flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                         ${
                           isActive
                             ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                             : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50"
                         }
                         ${!hasData && "opacity-50 cursor-not-allowed"}
                       `}
                      >
                        {strat === "Balanced" && "⚖️ สมดุล"}
                        {strat === "Aggressive" && "🔥 สายลุย"}
                        {strat === "Creative" && "💡 ไอเดีย"}
                        {strat === "Supportive" && "❤️ ซัพพอร์ต"}
                      </button>
                    );
                  })}
                </div>

                {/* Active Team Content */}
                {allResults[activeStrategy] ? (
                  <div className="animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                        {activeStrategy === "Balanced" && <Users size={100} />}
                        {activeStrategy === "Aggressive" && (
                          <Flame size={100} />
                        )}
                        {activeStrategy === "Creative" && <Zap size={100} />}
                        {activeStrategy === "Supportive" && (
                          <Mountain size={100} />
                        )}
                      </div>

                      <div className="relative z-10">
                        <div className="flex flex-col gap-4 mb-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full mb-2 border border-blue-100 dark:border-blue-800">
                                แนะนำสำหรับ: {activeStrategy} Strategy
                              </span>
                              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white break-words">
                                {allResults[activeStrategy]?.team_name}
                              </h2>
                            </div>
                            <button
                              onClick={handleConfirm}
                              className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <Save size={20} /> เลือกทีมนี้ & เริ่มโครงการ
                            </button>
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-slate-600 dark:text-slate-300 text-sm leading-relaxed border border-slate-100 dark:border-slate-700/50">
                          <span className="font-bold text-blue-500">
                            ✨ ทำไมถึงเวิร์ค:{" "}
                          </span>
                          {allResults[activeStrategy]?.reason}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Leader */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Crown size={16} className="text-yellow-500" /> Team
                          Leader
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <UserCard
                            name={
                              allResults[activeStrategy]?.leader?.name ||
                              "Unknown"
                            }
                            animal={
                              allResults[activeStrategy]?.leader?.animal || "?"
                            }
                            type={
                              allResults[activeStrategy]?.leader
                                ?.dominant_type || "D"
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

                      {/* Members */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Users size={16} /> Team Members
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          {allResults[activeStrategy]?.members?.map((m, i) => (
                            <UserCard
                              key={
                                m.id
                                  ? `m-${m.id}-${activeStrategy}`
                                  : `idx-${i}`
                              }
                              name={m.name || "Unknown"}
                              animal={m.animal || "?"}
                              type={m.dominant_type || "D"}
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
                  <div className="text-center py-20 text-red-400">
                    เกิดข้อผิดพลาดในการโหลดข้อมูลแผนนี้
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* --- Native Modal --- */}
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <Users
                    className="text-blue-600 dark:text-blue-400"
                    size={20}
                  />
                  Profile Details
                </h3>
                <div className="flex gap-2">
                  <a
                    href={`/result/${viewingUser.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-blue-500 transition hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    <ExternalLink size={20} />
                  </a>
                  <button
                    onClick={() => setViewingUser(null)}
                    className="p-2 text-slate-400 hover:text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto max-h-[70vh]">
                {loadingDetail ? (
                  <div className="flex justify-center py-10">
                    <ElementalLoader />
                  </div>
                ) : userDetail ? (
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="w-full max-w-xs transform hover:scale-105 transition-transform duration-300">
                        <UserCard
                          name={userDetail.name}
                          animal={userDetail.animal}
                          type={userDetail.dominant_type}
                        />
                      </div>
                    </div>
                    {userDetail.scores && (
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                          <Zap className="text-yellow-500" size={18} />{" "}
                          Elemental Analysis
                        </h4>
                        <div className="space-y-4">
                          <StatBar
                            label="Fire (กระทิง)"
                            value={userDetail.scores["D"] || 0}
                            color="bg-red-500"
                            icon={<Flame size={14} />}
                          />
                          <StatBar
                            label="Wind (อินทรี)"
                            value={userDetail.scores["I"] || 0}
                            color="bg-yellow-500"
                            icon={<Wind size={14} />}
                          />
                          <StatBar
                            label="Earth (หนู)"
                            value={userDetail.scores["S"] || 0}
                            color="bg-green-500"
                            icon={<Mountain size={14} />}
                          />
                          <StatBar
                            label="Water (หมี)"
                            value={userDetail.scores["C"] || 0}
                            color="bg-blue-500"
                            icon={<Droplets size={14} />}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-red-500">
                    ไม่พบข้อมูลผู้ใช้
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

// ✨ Component ย่อย (StatBar)
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
  const percent = Math.min(100, Math.max(5, (value / 40) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
        <span className="flex items-center gap-1">
          {icon} {label}
        </span>
        <span>{value} pts</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
