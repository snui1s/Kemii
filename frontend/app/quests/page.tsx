"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import {
  Scroll,
  Search,
  Filter,
  Clock,
  Users,
  Star,
  Zap,
  Shield,
  Sword,
  Wand,
  Heart,
  Skull,
  Check,
  X,
  History,
  LayoutGrid,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Quest {
  id: number;
  title: string;
  description: string;
  rank: string;
  required_skills: { name: string; level: number }[];
  optional_skills: { name: string; level: number }[];
  team_size: number;
  leader_id: number;
  leader_name: string;
  leader_class: string;
  status: string;
  applicant_count: number;
  start_date: string | null;
  deadline: string | null;
  created_at: string;
  harmony_score?: number;
}

// Removed MatchScore interface

// Removed MatchScore interface

const CLASS_ICONS: Record<string, React.ReactNode> = {
  Mage: <Wand size={16} />,
  Paladin: <Shield size={16} />,
  Warrior: <Sword size={16} />,
  Cleric: <Heart size={16} />,
  Rogue: <Skull size={16} />,
};

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  open: {
    label: "Pending",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    icon: Users,
  },
  filled: {
    label: "Pending (Ready)",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Check,
  },
  in_progress: {
    label: "In Progress",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    icon: Zap,
  },
  completed: {
    label: "Finished",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: Star,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    icon: X,
  },
  cancelled: {
    label: "Failed",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    icon: X,
  },
  late: {
    label: "Late",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    icon: AlertCircle,
  },
};

// Helper to determine display status
const getDisplayStatus = (q: Quest) => {
  // Final states are immutable
  if (["completed", "failed", "cancelled"].includes(q.status)) return q.status;

  const now = new Date();
  const startDate = q.start_date ? new Date(q.start_date) : null;
  const deadline = q.deadline ? new Date(q.deadline) : null;

  // Check Late
  if (deadline && now > deadline) return "late";

  // Check Auto-Start (only if filled/ready)
  if (q.status === "filled" && startDate && now >= startDate) {
    return "in_progress";
  }

  return q.status;
};

import { Suspense } from "react";

function QuestBoardContent() {
  const router = useRouter();
  const { user } = useAuth();
  // State for UI filters
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const initialView =
    (searchParams.get("view") as "active" | "history") || "active";
  const [viewMode, setViewMode] = useState<"active" | "history">(initialView);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Sync URL when viewMode changes
  const handleViewChange = (mode: "active" | "history") => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.replace(`/quests?${params.toString()}`);
  };

  // Reset filter when view mode changes
  useEffect(() => {
    // Use setTimeout to avoid synchronous state update warning
    const timer = setTimeout(() => setFilterStatus("all"), 0);
    return () => clearTimeout(timer);
  }, [viewMode]);

  // Fetch quests using TanStack Query
  const { data: quests = [], isLoading: loading } = useQuery({
    queryKey: ["quests"],
    queryFn: async () => {
      const res = await api.get("/quests");
      return res.data.quests as Quest[];
    },
  });

  const filteredQuests = quests
    .filter((q) => {
      const isHistory = ["completed", "failed", "cancelled"].includes(q.status);
      if (viewMode === "active" && isHistory) return false;
      if (viewMode === "history" && !isHistory) return false;

      // if (filterRank && q.rank !== filterRank) return false; // Removed
      if (filterStatus !== "all") {
        if (filterStatus === "success" && q.status !== "completed")
          return false;
        if (
          filterStatus === "failed" &&
          !["failed", "cancelled"].includes(q.status)
        )
          return false;
        if (
          ["open", "filled", "in_progress"].includes(filterStatus) &&
          q.status !== filterStatus
        )
          return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          q.title.toLowerCase().includes(query) ||
          q.description.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (sortOrder === "oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900/20 px-3 py-4 md:p-8 transition-colors">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-2">
              Guild Quest Board
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
              รับเควสที่เหมาะกับคุณ
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Top/Left Group: Toggles + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* View Toggle */}
              <div className="flex bg-white dark:bg-slate-800/20 p-1 rounded-xl shadow-sm h-11 self-start sm:self-auto">
                <button
                  onClick={() => handleViewChange("active")}
                  className={`px-4 h-full rounded-lg text-sm font-bold flex items-center gap-2 transition ${
                    viewMode === "active"
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <LayoutGrid size={16} /> Active
                </button>
                <button
                  onClick={() => handleViewChange("history")}
                  className={`px-4 h-full rounded-lg text-sm font-bold flex items-center gap-2 transition ${
                    viewMode === "history"
                      ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <History size={16} /> History
                </button>
              </div>

              {/* Filters & Sort */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-2 rounded-xl shadow-sm h-11 overflow-x-auto w-full sm:w-auto">
                <Filter size={16} className="text-slate-400 shrink-0" />
                {/* Filter Dropdown */}
                <Select
                  value={filterStatus}
                  onValueChange={(val) => setFilterStatus(val)}
                >
                  <SelectTrigger className="h-full border-none bg-white dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-700/50 shadow-none focus:ring-0 text-slate-600 dark:text-slate-300 font-bold min-w-[100px] p-0 gap-1">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด (All)</SelectItem>
                    {viewMode === "active" ? (
                      <>
                        <SelectItem value="filled">คนครบแล้ว</SelectItem>
                        <SelectItem value="in_progress">กำลังลุย</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="success">สำเร็จ</SelectItem>
                        <SelectItem value="failed">ล้มเหลว</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                <div className="w-px h-6 bg-white dark:bg-slate-800/20 mx-1"></div>
                {/* Sort Dropdown */}
                <Select
                  value={sortOrder}
                  onValueChange={(val) =>
                    setSortOrder(val as "newest" | "oldest")
                  }
                >
                  <SelectTrigger className="h-full border-none bg-white dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-700/50 bg-transparent shadow-none focus:ring-0 text-slate-600 dark:text-slate-300 font-bold p-0 gap-1">
                    <SelectValue placeholder="เรียงลำดับ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">ใหม่สุด</SelectItem>
                    <SelectItem value="oldest">เก่าสุด</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Group: Search + Create */}
            <div className="flex flex-1 gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาเควส..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>

              {user && (
                <button
                  onClick={() => router.push("/quests/team")}
                  className="h-11 px-4 lg:px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:scale-105 whitespace-nowrap"
                >
                  <Scroll size={18} />{" "}
                  <span className="hidden sm:inline">Create Quest</span>{" "}
                  <span className="sm:hidden">Create</span>
                </button>
              )}
            </div>
          </div>

          {/* Quest Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredQuests.map((quest) => {
              // Check if it's a Smart Quest (usually has "Dept:" skills or high harmony)
              const isSmartQuest =
                quest.description.includes("Smart Quest") ||
                quest.harmony_score;

              return (
                <div
                  key={quest.id}
                  className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden p-5 flex flex-col"
                  onClick={() =>
                    router.push(`/quests/${quest.id}?return_view=${viewMode}`)
                  }
                >
                  {/* Status Badge (Top Right) */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-2">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {quest.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {quest.description &&
                        quest.description.startsWith("Auto-generated")
                          ? ""
                          : quest.description}
                      </p>
                    </div>
                    {(() => {
                      const displayStatus = getDisplayStatus(quest);
                      const statusInfo =
                        STATUS_LABELS[displayStatus] || STATUS_LABELS.open;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <span
                          className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${statusInfo.color}`}
                        >
                          <StatusIcon size={12} /> {statusInfo.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Party & Roles Info */}
                  <div className="flex-1 space-y-4">
                    {/* Roles / Departments */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Scroll size={10} /> Roles
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {quest.required_skills.slice(0, 3).map((skill, i) => {
                          const isDept = skill.name.startsWith("Dept:");
                          const name = isDept
                            ? skill.name.replace("Dept: ", "")
                            : skill.name;
                          return (
                            <span
                              key={i}
                              className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 ${
                                isDept
                                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                  : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300"
                              }`}
                            >
                              {isDept && <Users size={10} />}
                              {name}
                            </span>
                          );
                        })}
                        {quest.required_skills.length > 3 && (
                          <span className="px-1.5 py-1 text-[10px] text-slate-400">
                            +{quest.required_skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Harmony / Stats */}
                    {quest.harmony_score ? (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-400">
                            Harmony (ความเข้ากันได้)
                          </span>
                          <span
                            className={`font-bold ${
                              quest.harmony_score >= 80
                                ? "text-green-500"
                                : "text-amber-500"
                            }`}
                          >
                            {Math.round(quest.harmony_score)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              quest.harmony_score >= 80
                                ? "bg-green-500"
                                : quest.harmony_score >= 60
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${quest.harmony_score}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                        <Clock size={12} /> Deadline:{" "}
                        {quest.deadline
                          ? new Date(quest.deadline).toLocaleDateString("th-TH")
                          : "N/A"}
                      </div>
                    )}
                  </div>

                  {/* Footer: Leader & Party Size */}
                  <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700">
                        {CLASS_ICONS[quest.leader_class] || <Users size={12} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-none">
                          {quest.leader_name}
                        </span>
                        <span className="text-[9px] text-slate-400 leading-none mt-0.5">
                          {quest.leader_class}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                      <Users size={12} />
                      <span>{quest.team_size}</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        Slots
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredQuests.length === 0 && (
            <div className="text-center py-16">
              <Scroll className="mx-auto mb-4 text-amber-500" size={48} />
              <p className="text-slate-500 dark:text-slate-400">ยังไม่มีเควส</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function QuestBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      }
    >
      <QuestBoardContent />
    </Suspense>
  );
}
