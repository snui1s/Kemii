"use client";
import { useState, useMemo } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  History,
  RefreshCcw,
  CheckCircle2,
  Clock,
  Users,
  ArrowLeft,
  XCircle,
  Crown,
  Trash2,
  Filter,
  CalendarRange,
  PowerOff,
  PlayCircle,
  Scroll,
  Beer,
  Wine,
} from "lucide-react";
import Link from "next/link";
import ElementalLoader from "@/components/ElementalLoader";
import toast from "react-hot-toast";
import AuthGuard from "@/components/AuthGuard";
import ThemeBackground from "@/components/ThemeBackground";

// ✅ Interface เดิม
interface TeamLog {
  id: number;
  team_name: string;
  strategy: string;
  reason: string;
  status: "generated" | "confirmed" | "disbanded";
  created_at: string;
  leader_id: number;
  leader_name?: string;
  leader_class?: string;
  project_start_date?: string;
  project_end_date?: string;
  members_snapshot: {
    id: number;
    name: string;
    character_class?: string;
    dominant_type?: string;
    level?: number;
    scores?: { [key: string]: number };
    ocean_scores?: { [key: string]: number };
    ocean_openness?: number;
    ocean_conscientiousness?: number;
    ocean_extraversion?: number;
    ocean_agreeableness?: number;
    ocean_neuroticism?: number;
  }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TeamHistoryPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const {
    data: logs = [],
    isLoading: loading,
    refetch: refetchLogs,
  } = useQuery<TeamLog[]>({
    queryKey: ["team-history"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/team-logs`);
      return res.data;
    },
  });

  // --- Helpers ---
  const getClassColor = (cls: string) => {
    const s = (cls || "").toLowerCase();
    if (s.includes("mage") || s.includes("เวทย์"))
      return {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-700 dark:text-purple-300",
        border: "border-purple-200 dark:border-purple-700",
        ring: "ring-purple-500",
      };
    if (s.includes("paladin") || s.includes("อัศวิน"))
      return {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-300",
        border: "border-yellow-200 dark:border-yellow-700",
        ring: "ring-yellow-500",
      };
    if (s.includes("warrior") || s.includes("นักรบ"))
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-700",
        ring: "ring-red-500",
      };
    if (s.includes("cleric") || s.includes("นักบวช"))
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-200 dark:border-green-700",
        ring: "ring-green-500",
      };
    if (s.includes("rogue") || s.includes("โจร"))
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-700",
        ring: "ring-blue-500",
      };
    return {
      bg: "bg-slate-100 dark:bg-slate-800",
      text: "text-slate-600 dark:text-slate-400",
      border: "border-slate-200 dark:border-slate-700",
      ring: "ring-slate-400",
    };
  };

  // --- Helper Logic ---
  const getLeaderInfo = (log: TeamLog) => {
    if (log.leader_name) {
      return {
        name: log.leader_name,
        className: log.leader_class || "Novice",
        type: "Leader",
        scores: undefined,
      };
    }
    const leaderInMembers = log.members_snapshot.find(
      (m) => m.id === log.leader_id
    );
    if (leaderInMembers) {
      return {
        name: leaderInMembers.name,
        className: leaderInMembers.character_class || "Novice",
        type: "Leader",
        scores: leaderInMembers.scores ||
          leaderInMembers.ocean_scores || {
            Openness: leaderInMembers.ocean_openness || 0,
            Conscientiousness: leaderInMembers.ocean_conscientiousness || 0,
            Extraversion: leaderInMembers.ocean_extraversion || 0,
            Agreeableness: leaderInMembers.ocean_agreeableness || 0,
            Neuroticism: leaderInMembers.ocean_neuroticism || 0,
          },
      };
    }
    return {
      name: `Leader #${log.leader_id}`,
      className: "Novice",
      type: "Unknown",
      scores: undefined,
    };
  };

  // --- 🔥 Handlers (Updated from fake.tsx) ---

  // 1. Revive (เซ็นสัญญาใหม่)
  const handleRevive = (id: number, teamName: string) => {
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const nextMonthStr = nextMonth.toISOString().split("T")[0];

    let tempStart = today;
    let tempEnd = nextMonthStr;

    toast.dismiss("revive-toast");
    toast(
      (t) => (
        <div className="flex flex-col gap-3 min-w-[280px]">
          <div className="text-center">
            <strong className="text-green-600 text-lg flex items-center justify-center gap-2">
              <PlayCircle size={20} /> ใช้งานทีม {teamName}?
            </strong>
            <p className="text-xs text-slate-500 mt-1">
              กำหนดวันเริ่ม-จบงานใหม่
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Start Date
              </label>
              <input
                type="date"
                defaultValue={tempStart}
                onChange={(e) => (tempStart = e.target.value)}
                className="w-full p-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                End Date
              </label>
              <input
                type="date"
                defaultValue={tempEnd}
                onChange={(e) => (tempEnd = e.target.value)}
                className="w-full p-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = toast.loading("กำลังตรวจสอบคิวงาน...");
                try {
                  await axios.post(`${API_URL}/team-logs/${id}/revive`, {
                    start_date: tempStart,
                    end_date: tempEnd,
                  });
                  toast.success("ยืนยันทีมเรียบร้อย! ลุยงานได้เลย", {
                    id: toastId,
                  });
                  refetchLogs();
                } catch (error) {
                  if (
                    axios.isAxiosError(error) &&
                    error.response?.status === 409
                  ) {
                    toast.error(error.response.data.detail, {
                      id: toastId,
                      duration: 5000,
                    });
                  } else {
                    toast.error("เกิดข้อผิดพลาดในการยืนยันทีม", {
                      id: toastId,
                    });
                  }
                }
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold shadow-md transition-colors"
            >
              ยืนยัน
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ),
      {
        id: "revive-toast",
        duration: Infinity,
        className:
          "!bg-white dark:!bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl",
      }
    );
  };

  // 2. Disband (ยุบทีม)
  const handleDisband = (id: number, teamName: string) => {
    toast.dismiss("disband-toast");
    toast(
      (t) => (
        <div className="flex flex-col gap-2 items-center min-w-[220px]">
          <strong className="text-orange-600">ยุบทีม {teamName}?</strong>
          <span className="text-xs text-slate-500 text-center">
            สมาชิกทุกคนจะกลับมาว่าง <br /> แต่ประวัติทีมจะยังเก็บไว้นะ
          </span>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                toast.promise(
                  axios.post(`${API_URL}/team-logs/${id}/disband`),
                  {
                    loading: "กำลังยุบทีม...",
                    success: () => {
                      refetchLogs();
                      return "ยุบทีมเรียบร้อย!";
                    },
                    error: "เกิดข้อผิดพลาด",
                  }
                );
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm"
            >
              ยุบทีมเลย
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-sm"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ),
      {
        id: "disband-toast",
        duration: 5000,
        className:
          "!bg-white dark:!bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl",
      }
    );
  };

  // 3. Delete (ลบประวัติ)
  const handleDelete = (id: number) => {
    toast.dismiss("delete-toast");
    toast(
      (t) => (
        <div className="flex flex-col gap-2 items-center min-w-[200px]">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            ลบรายการนี้ใช่ไหม?
          </span>
          <div className="flex gap-2 mt-1">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                toast.promise(axios.delete(`${API_URL}/team-logs/${id}`), {
                  loading: "กำลังลบ...",
                  success: () => {
                    refetchLogs();
                    return "ลบเรียบร้อย!";
                  },
                  error: "ลบไม่สำเร็จ",
                });
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              ลบเลย
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-3 py-1 rounded-lg text-sm transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ),
      {
        id: "delete-toast",
        duration: 4000,
        className:
          "!bg-white dark:!bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl",
      }
    );
  };

  // 4. Clear All (ล้างทั้งหมด)
  const handleClearAll = () => {
    toast.dismiss("clear-all-toast");
    toast(
      (t) => (
        <div className="flex flex-col gap-2 items-center min-w-[250px]">
          <div className="text-center">
            <strong className="text-red-600 block text-lg">⚠️ เตือนภัย!</strong>
            <span className="text-slate-600 text-sm dark:text-slate-200">
              ประวัติจะหายหมด กู้คืนไม่ได้นะ?
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                toast.promise(axios.delete(`${API_URL}/team-logs`), {
                  loading: "กำลังกวาดล้าง...",
                  success: () => {
                    refetchLogs();
                    return "สะอาดเอี่ยม! ล้างประวัติแล้ว";
                  },
                  error: "เกิดข้อผิดพลาดในการล้าง",
                });
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              ยืนยันล้างทิ้ง
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              ไม่ล้างแล้ว
            </button>
          </div>
        </div>
      ),
      {
        id: "clear-all-toast",
        duration: 5000,
        className:
          "!bg-white dark:!bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl",
      }
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => filterStatus === "all" || log.status === filterStatus)
      .sort((a, b) => {
        const priority: Record<string, number> = {
          confirmed: 1, // บนสุด
          generated: 2, // กลาง
          disbanded: 3, // ล่างสุด
        };

        const scoreA = priority[a.status] || 2;
        const scoreB = priority[b.status] || 2;

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [logs, filterStatus]);

  return (
    <AuthGuard>
      {/* Background: Clean White/Black Theme */}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950/20 p-4 md:p-8 transition-colors font-sans relative overflow-hidden">
        <ThemeBackground />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* 🍺 Header: Tavern Style but Clean */}
          <div className="flex flex-col gap-6 mb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <Link
                  href="/build-team"
                  className="text-xs font-medium text-slate-500 hover:text-amber-600 flex items-center gap-1 mb-2 transition-colors"
                >
                  <ArrowLeft size={14} /> กลับสู่บาร์กิลด์
                </Link>
                <div className="flex items-center gap-4">
                  {/* Icon Box: สีส้มอำพัน (Tavern vibe) */}
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-500 shadow-sm rotate-3">
                    <Beer size={32} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                      หอจดหมายเหตุกิลด์
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                      บันทึกภารกิจและวงเหล้าในอดีต{" "}
                      <Wine size={12} className="opacity-50" />
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Tools */}
              <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent text-sm font-bold px-2 py-1.5 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-slate-900">
                    📜 ดูคัมภีร์ทั้งหมด
                  </option>
                  <option
                    value="confirmed"
                    className="bg-white dark:bg-slate-900"
                  >
                    ✅ ภารกิจต่อเนื่อง
                  </option>
                  <option
                    value="generated"
                    className="bg-white dark:bg-slate-900"
                  >
                    🍺 ร่างแผนงาน
                  </option>
                  <option
                    value="disbanded"
                    className="bg-white dark:bg-slate-900"
                  >
                    ❌ วงแตก (ยุบทีม)
                  </option>
                </select>
                <button
                  onClick={() => refetchLogs()}
                  className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-500 hover:text-amber-600 rounded-lg transition-colors"
                >
                  <RefreshCcw size={18} />
                </button>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <ElementalLoader />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-slate-900/50">
              <Beer size={48} className="mb-4 opacity-50" />
              <span className="font-bold">โรงเตี๊ยมเงียบเหงา...</span>
              <span className="text-xs">ยังไม่มีใครตั้งปาร์ตี้เลย</span>
            </div>
          ) : (
            <div className="grid gap-8">
              {filteredLogs.map((log) => {
                const isConfirmed = log.status === "confirmed";
                const isDisbanded = log.status === "disbanded";
                const leaderInfo = getLeaderInfo(log);
                const leaderColor = getClassColor(leaderInfo.className);

                // 🎨 UI Logic: Tavern Clean Theme
                let cardClass =
                  "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"; // Default (Draft)

                if (isConfirmed) {
                  // Active: สีเขียวมรกต/ทอง (ดูขลัง)
                  cardClass =
                    "bg-white dark:bg-slate-900 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xl shadow-emerald-500/5";
                }
                if (isDisbanded) {
                  // 🔴 Disbanded: สีแดง (ตามรีเควส)
                  cardClass =
                    "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 opacity-90";
                }

                return (
                  <div
                    key={log.id}
                    className={`relative p-6 sm:p-8 rounded-2xl border transition-all duration-300 group ${cardClass} overflow-hidden`}
                  >
                    {/* 🍺 Watermark: แก้วเบียร์จางๆ ตกแต่งพื้นหลัง */}
                    <div className="absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-[0.05] pointer-events-none transform rotate-12 group-hover:scale-110 transition-transform duration-700">
                      <Beer size={200} />
                    </div>

                    {/* Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      {isConfirmed ? (
                        <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-500/30">
                          <CheckCircle2 size={14} /> ภารกิจต่อเนื่อง
                        </div>
                      ) : isDisbanded ? (
                        // 🔴 Badge แดง
                        <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-200 dark:border-red-800">
                          <XCircle size={14} /> ยุบทีมแล้ว
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-500/30">
                          <Clock size={14} /> แบบร่าง (Draft)
                        </div>
                      )}
                    </div>

                    <div className="relative z-10">
                      {/* 1. Header */}
                      <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <h3
                          className={`text-2xl font-black mb-2 text-slate-800 dark:text-white ${
                            isDisbanded
                              ? "line-through decoration-4 decoration-red-400/50 text-red-800 dark:text-red-400"
                              : ""
                          }`}
                        >
                          {log.team_name}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            <Scroll size={14} /> กลยุทธ์: {log.strategy}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} />{" "}
                            {new Date(log.created_at).toLocaleString("th-TH")}
                          </span>
                          {log.project_start_date && (
                            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                              <CalendarRange size={14} />{" "}
                              {formatDate(log.project_start_date)} -{" "}
                              {formatDate(log.project_end_date)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2. Custom Roster UI */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Leader Section (Orange Box) */}
                        <div className="lg:col-span-4 flex flex-col gap-3">
                          <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase flex items-center gap-2">
                            <Crown size={14} /> Party Leader
                          </h4>

                          <div
                            className={`
                            p-5 rounded-xl border-l-4 shadow-sm relative overflow-hidden
                            bg-gradient-to-br from-amber-50 to-white dark:from-slate-800 dark:to-slate-900
                            border-amber-400 ring-1 ring-amber-400/20
                          `}
                          >
                            {/* Decoration */}
                            <div className="absolute right-2 top-2 opacity-10 text-amber-500 pointer-events-none">
                              <Crown size={64} />
                            </div>

                            <div className="relative z-10">
                              <div className="text-amber-600 dark:text-amber-500 text-xs font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                                {leaderInfo.className}
                              </div>
                              <div className="text-lg font-bold text-slate-800 dark:text-white truncate pr-2">
                                {leaderInfo.name}
                              </div>
                              <div className="mt-3 flex gap-2">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${leaderColor.bg} ${leaderColor.text} ${leaderColor.border}`}
                                >
                                  Lv. Leader
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Member Section (Badges) */}
                        <div className="lg:col-span-8 flex flex-col gap-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Users size={14} /> Party Members (
                            {log.members_snapshot.length})
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {log.members_snapshot.map((m) => {
                              const memberClass = m.character_class || "Novice";
                              const colors = getClassColor(memberClass);

                              return (
                                <div
                                  key={m.id}
                                  className={`
                                    flex items-center gap-3 p-3 rounded-lg border
                                    bg-white dark:bg-slate-800 hover:shadow-md transition-shadow
                                    ${
                                      colors.border
                                    } border-l-4 ${colors.bg.replace(
                                    "bg-",
                                    "border-l-"
                                  )}
                                  `}
                                >
                                  {/* Icon Circle */}
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${colors.bg} ${colors.text}`}
                                  >
                                    {memberClass.charAt(0)}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-700 dark:text-slate-200 truncate text-sm">
                                      {m.name}
                                    </div>
                                    <div
                                      className={`text-xs ${colors.text} opacity-80 flex items-center gap-1`}
                                    >
                                      {memberClass} •{" "}
                                      {m.dominant_type ||
                                        (m.level ? `Lv.${m.level}` : "Lv.1")}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* 3. Reason & Footer */}
                      {!isDisbanded && (
                        <div className="mt-8 bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 relative italic">
                          <div className="absolute left-0 top-6 w-1 h-6 bg-amber-400 rounded-r-full"></div>
                          <strong className="block mb-1 text-slate-800 dark:text-white not-italic flex items-center gap-2">
                            📜 บันทึกจากกุนซือ:
                          </strong>
                          "{log.reason}"
                        </div>
                      )}

                      <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {!isConfirmed && (
                          <button
                            onClick={() => handleRevive(log.id, log.team_name)}
                            className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500 font-bold shadow-sm flex items-center gap-2 transition-all hover:-translate-y-0.5"
                          >
                            <PlayCircle size={16} /> เซ็นสัญญา
                          </button>
                        )}
                        {isConfirmed && (
                          <button
                            onClick={() => handleDisband(log.id, log.team_name)}
                            className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-2 transition-colors"
                          >
                            <PowerOff size={16} /> ยุบทีม
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                          title="ลบถาวร"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
