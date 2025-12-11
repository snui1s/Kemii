"use client";
import { useState } from "react";
import axios from "axios"; // Added axios import
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
} from "lucide-react";
import Link from "next/link";
import ElementalLoader from "@/components/ElementalLoader";
import toast from "react-hot-toast";
import AuthGuard from "@/components/AuthGuard";

interface TeamLog {
  id: number;
  team_name: string;
  strategy: string;
  reason: string;
  status: "generated" | "confirmed" | "disbanded";
  created_at: string;
  leader_id: number;
  leader_name: string;
  leader_animal: string;
  project_start_date?: string;
  project_end_date?: string;
  members_snapshot: {
    id: number;
    name: string;
    animal: string;
    dominant_type: string;
  }[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TeamHistoryPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // ✅ ใช้ TanStack Query
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

  // ✅ 2. ฟังก์ชัน Revive (ยืนยันทีมเก่า)
  const handleRevive = (id: number, teamName: string) => {
    // กำหนดค่า Default วันที่ (วันนี้ - อีก 30 วัน)
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const nextMonthStr = nextMonth.toISOString().split("T")[0];

    // ตัวแปรเก็บค่าชั่วคราว (ใช้ใน Toast)
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

          {/* Date Inputs ใน Toast */}
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
                // ยิง API
                const toastId = toast.loading("กำลังตรวจสอบคิวงาน...");
                try {
                  await axios.post(`${API_URL}/team-logs/${id}/revive`, {
                    start_date: tempStart,
                    end_date: tempEnd,
                  });
                  toast.success("ยืนยันทีมเรียบร้อย! ลุยงานได้เลย", {
                    id: toastId,
                  });
                  refetchLogs(); // โหลดข้อมูลใหม่
                } catch (error) {
                  // Handle Error กรณีคนไม่ว่าง
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
        duration: Infinity, // ให้ค้างไว้จนกว่าจะกดปุ่ม
        className:
          "!bg-white dark:!bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl",
      }
    );
  };

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

  const getElementStyle = (type: string) => {
    switch (type) {
      case "D":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "I":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "S":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "C":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const filteredLogs = logs
    .filter((log) => {
      if (filterStatus === "all") return true;
      return log.status === filterStatus;
    })
    .sort((a, b) => {
      const priority: Record<string, number> = {
        confirmed: 1,
        generated: 2,
        disbanded: 3,
      };
      const scoreA = priority[a.status] || 99;
      const scoreB = priority[b.status] || 99;

      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800 p-6 transition-colors">
        <div className="max-w-4xl mx-auto">
          {/* Header Area */}

          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <Link
                  href="/build-team"
                  className="text-sm text-slate-500 hover:text-blue-500 flex items-center gap-1 mb-2"
                >
                  <ArrowLeft size={16} /> กลับหน้าจัดทีม
                </Link>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <History className="text-blue-600" /> ประวัติการจัดทีม
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full appearance-none pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">แสดงทั้งหมด</option>
                    <option value="confirmed">
                      ✅ ทีมที่เลือกจริง (Confirmed)
                    </option>
                    <option value="generated">🤖 ทีมจาก AI (Generated)</option>
                    <option value="disbanded">
                      ❌ ทีมที่ยุบแล้ว (Disbanded)
                    </option>
                  </select>
                  <Filter
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => refetchLogs()}
                    className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                    title="รีเฟรชข้อมูล"
                  >
                    <RefreshCcw size={20} />
                  </button>

                  {logs.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                      title="ล้างทั้งหมด"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <ElementalLoader />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-2">
              <History size={48} className="opacity-20" />
              <span>ไม่พบข้อมูลตามเงื่อนไขที่เลือก</span>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredLogs.map((log) => {
                const isConfirmed = log.status === "confirmed";
                const isDisbanded = log.status === "disbanded";
                const isGenerated = log.status === "generated";

                let cardClass =
                  "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100";
                if (isConfirmed)
                  cardClass =
                    "bg-white dark:bg-slate-800 border-green-500 shadow-lg ring-1 ring-green-500/20 order-first";
                if (isDisbanded)
                  cardClass =
                    "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 opacity-75 grayscale-[0.3] hover:grayscale-0 hover:opacity-100";

                return (
                  <div
                    key={log.id}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${cardClass} group`}
                  >
                    {/* Badge Status */}
                    <div className="absolute top-4 right-4 z-10">
                      {isConfirmed && (
                        <span
                          className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-800 shadow-sm"
                          title="ใช้งานอยู่"
                        >
                          <CheckCircle2 size={14} />{" "}
                          <span className="hidden sm:inline">ใช้งานอยู่</span>
                        </span>
                      )}
                      {isDisbanded && (
                        <span
                          className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full border border-red-200 dark:border-red-800 shadow-sm"
                          title="เลิกใช้งานแล้ว"
                        >
                          <XCircle size={14} />{" "}
                          <span className="hidden sm:inline">
                            เลิกใช้งานแล้ว
                          </span>
                        </span>
                      )}
                      {isGenerated && (
                        <span
                          className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full border border-slate-300 dark:border-slate-700"
                          title="รอใช้งาน"
                        >
                          <Clock size={14} />{" "}
                          <span className="hidden sm:inline">รอใช้งาน</span>
                        </span>
                      )}
                    </div>

                    {/* 1. ชื่อทีม & เวลา */}
                    <div className="mb-6">
                      <h3
                        className={`text-2xl font-black mb-1 break-words ${
                          isDisbanded
                            ? "text-red-800 dark:text-red-300 line-through decoration-2 decoration-red-400"
                            : "text-slate-800 dark:text-white"
                        }`}
                      >
                        {log.team_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-medium whitespace-nowrap">
                          แผน: {log.strategy}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("th-TH")}
                        </span>

                        {log.project_start_date && log.project_end_date && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800 whitespace-nowrap mt-1 sm:mt-0">
                            <CalendarRange size={14} />
                            {formatDate(log.project_start_date)} -{" "}
                            {formatDate(log.project_end_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 2. Leader Section */}
                    <div
                      className={`
                    mb-4 p-4 rounded-xl border flex items-center gap-4
                    ${
                      isDisbanded
                        ? "bg-red-100/50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-linear-to-r from-amber-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700"
                    }
                  `}
                    >
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm shrink-0">
                        <Crown
                          size={24}
                          className="text-yellow-500 fill-yellow-500"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                          Team Leader
                        </p>
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          {log.leader_name}
                          <span className="px-2 py-0.5 text-xs bg-white/50 dark:bg-black/20 rounded-full border border-amber-200 dark:border-amber-800/50">
                            {log.leader_animal}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          ID: {log.leader_id}
                        </p>
                      </div>
                    </div>

                    {/* 3. Member List */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">
                        <Users size={14} /> สมาชิก (
                        {log.members_snapshot.length} คน)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {log.members_snapshot.map((m) => (
                          <div
                            key={m.id}
                            className={`
                            px-3 py-1.5 rounded-lg border text-sm font-semibold flex items-center gap-2 shadow-sm
                            ${getElementStyle(m.dominant_type)}
                          `}
                          >
                            <span>{m.name}</span>
                            <span className="opacity-70 text-xs">
                              ({m.animal})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reason & Actions */}
                    <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                      {!isDisbanded ? (
                        <details className="group">
                          <summary className="text-xs font-bold text-blue-500 cursor-pointer hover:underline flex items-center gap-1 w-fit select-none">
                            💡 ดูเหตุผลการจัดทีมของ AI
                          </summary>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm leading-relaxed animate-fade-in max-w-2xl">
                            {log.reason}
                          </p>
                        </details>
                      ) : (
                        <div className="text-xs text-red-400 italic">
                          ทีมนี้ถูกยุบแล้ว
                        </div>
                      )}

                      {/* ✅ 3. ปุ่ม Actions */}
                      <div className="flex gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                        {/* 1. ปุ่ม Revive/Confirm (โชว์เฉพาะถ้ายังไม่ confirm) */}
                        {!isConfirmed && (
                          <button
                            onClick={() => handleRevive(log.id, log.team_name)}
                            className="flex-1 sm:flex-none p-2 text-green-600 hover:text-white hover:bg-green-500 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg transition-all shadow-sm flex justify-center"
                            title="ยืนยันทีมนี้ (ใช้งาน)"
                          >
                            <PlayCircle size={18} />
                          </button>
                        )}

                        {/* 2. ปุ่ม Disband (โชว์เฉพาะถ้า confirmed) */}
                        {isConfirmed && (
                          <button
                            onClick={() => handleDisband(log.id, log.team_name)}
                            className="flex-1 sm:flex-none p-2 text-orange-400 hover:text-white hover:bg-orange-500 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-lg transition-all shadow-sm flex justify-center"
                            title="ยุบทีม (คืนค่าสมาชิก)"
                          >
                            <PowerOff size={18} />
                          </button>
                        )}

                        {/* 3. ปุ่ม Delete */}
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="flex-1 sm:flex-none p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex justify-center"
                          title="ลบรายการนี้"
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
