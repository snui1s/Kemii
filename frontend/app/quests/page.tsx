"use client";
import { useState, useEffect, Suspense } from "react";
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

import ElementalLoader from "@/components/ElementalLoader";

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  open: {
    label: "Pending",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: Users,
  },
  filled: {
    label: "Pending (Ready)",
    color:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: Check,
  },
  in_progress: {
    label: "In Progress",
    color:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    icon: Zap,
  },
  completed: {
    label: "Finished",
    color:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: Star,
  },
  failed: {
    label: "Failed",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
    icon: X,
  },
  cancelled: {
    label: "Failed",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
    icon: X,
  },
  late: {
    label: "Late",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] transition-colors">
        <ElementalLoader />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-3 py-4 md:p-8 transition-colors font-[family-name:var(--font-line-seed)]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-black text-[var(--foreground)] mb-2 flex items-center justify-center gap-2">
              Guild Quest Board
            </h1>
            <p className="text-[var(--muted)] text-sm md:text-base opacity-80">
              รีบทำเควสให้เสร็จเด้อ
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Top/Left Group: Toggles + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* View Toggle */}
              <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl shadow-sm h-11 self-start sm:self-auto backdrop-blur-sm">
                <button
                  onClick={() => handleViewChange("active")}
                  className={`px-4 h-full rounded-lg text-sm font-bold flex items-center gap-2 transition ${
                    viewMode === "active"
                      ? "bg-[var(--highlight)] text-white shadow-md"
                      : "text-[var(--muted)] hover:bg-[var(--highlight)]/10 hover:text-[var(--highlight)]"
                  }`}
                >
                  <LayoutGrid size={16} /> Active
                </button>
                <button
                  onClick={() => handleViewChange("history")}
                  className={`px-4 h-full rounded-lg text-sm font-bold flex items-center gap-2 transition ${
                    viewMode === "history"
                      ? "bg-[var(--highlight)] text-white shadow-md"
                      : "text-[var(--muted)] hover:bg-[var(--highlight)]/10 hover:text-[var(--highlight)]"
                  }`}
                >
                  <History size={16} /> History
                </button>
              </div>

              {/* Filters & Sort */}
              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-2 rounded-xl shadow-sm h-11 overflow-x-auto w-full sm:w-auto backdrop-blur-sm">
                <Filter size={16} className="text-[var(--muted)] shrink-0" />
                {/* Filter Dropdown */}
                <Select
                  value={filterStatus}
                  onValueChange={(val) => setFilterStatus(val)}
                >
                  <SelectTrigger className="h-full border-0 bg-transparent hover:bg-[var(--highlight)]/10 hover:text-[var(--highlight)] shadow-none focus:ring-0 focus:ring-offset-0 text-[var(--foreground)] font-bold min-w-[130px] px-3 transition-colors">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--background)]/95 backdrop-blur-xl border-black/5 dark:border-white/5 text-[var(--foreground)]">
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

                <div className="w-px h-6 bg-[var(--muted)]/20 mx-1"></div>
                {/* Sort Dropdown */}
                <Select
                  value={sortOrder}
                  onValueChange={(val) =>
                    setSortOrder(val as "newest" | "oldest")
                  }
                >
                  <SelectTrigger className="h-full border-0 bg-transparent hover:bg-[var(--highlight)]/10 hover:text-[var(--highlight)] shadow-none focus:ring-0 focus:ring-offset-0 text-[var(--foreground)] font-bold min-w-[130px] px-3 transition-colors">
                    <SelectValue placeholder="เรียงลำดับ" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--background)]/95 backdrop-blur-xl border-black/5 dark:border-white/5 text-[var(--foreground)]">
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
                <div className="absolute left-3 top-[13px] z-10 text-[var(--muted)] pointer-events-none">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาเควส..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl text-[var(--foreground)] text-sm placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--highlight)]/50 transition-all shadow-sm backdrop-blur-sm"
                />
              </div>

              {user && (
                <button
                  onClick={() => router.push("/quests/team")}
                  className="h-11 px-4 lg:px-6 bg-[var(--highlight)] hover:opacity-90 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-[var(--highlight)]/30 transition-all transform hover:scale-105 whitespace-nowrap"
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
                  className="group relative bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 hover:border-[var(--highlight)]/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden p-5 flex flex-col backdrop-blur-sm"
                  onClick={() =>
                    router.push(`/quests/${quest.id}?return_view=${viewMode}`)
                  }
                >
                  {/* Status Badge (Top Right) */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-2">
                      <h3 className="text-lg font-bold text-[var(--foreground)] leading-tight group-hover:text-[var(--highlight)] transition-colors">
                        {quest.title}
                      </h3>
                      <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">
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
                      <span className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1 opacity-70">
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
                                  ? "bg-black/5 dark:bg-white/5 text-[var(--foreground)] border border-black/5 dark:border-white/5"
                                  : "bg-[var(--highlight)]/10 text-[var(--highlight)]"
                              }`}
                            >
                              {isDept && <Users size={10} />}
                              {name}
                            </span>
                          );
                        })}
                        {quest.required_skills.length > 3 && (
                          <span className="px-1.5 py-1 text-[10px] text-[var(--muted)]">
                            +{quest.required_skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Harmony / Stats */}
                    {quest.harmony_score ? (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-[var(--muted)]">
                            Harmony (ความเข้ากันได้)
                          </span>
                          <span
                            className={`font-bold ${
                              quest.harmony_score >= 80
                                ? "text-emerald-500"
                                : "text-amber-500"
                            }`}
                          >
                            {Math.round(quest.harmony_score)}%
                          </span>
                        </div>
                        <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              quest.harmony_score >= 80
                                ? "bg-emerald-500"
                                : quest.harmony_score >= 60
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${quest.harmony_score}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)] py-1 opacity-80">
                        <Clock size={12} /> Deadline:{" "}
                        {quest.deadline
                          ? new Date(quest.deadline).toLocaleDateString("th-TH")
                          : "N/A"}
                      </div>
                    )}
                  </div>

                  {/* Footer: Leader & Party Size */}
                  <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--foreground)] shadow-sm">
                        {CLASS_ICONS[quest.leader_class] || <Users size={12} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[var(--foreground)] leading-none">
                          {quest.leader_name}
                        </span>
                        <span className="text-[9px] text-[var(--muted)] leading-none mt-0.5 opacity-80">
                          {quest.leader_class}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--muted)] bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
                      <Users size={12} />
                      <span>{quest.team_size}</span>
                      <span className="text-[10px] font-normal opacity-70">
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
              <Scroll className="mx-auto mb-4 text-[var(--highlight)] opacity-50" size={48} />
              <p className="text-[var(--muted)]">ยังไม่มีเควส</p>
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
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] transition-colors">
          <ElementalLoader />
        </div>
      }
    >
      <QuestBoardContent />
    </Suspense>
  );
}
