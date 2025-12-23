"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Scroll,
  Plus,
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
  ChevronRight,
  Crown,
  Check,
  X,
  History,
  LayoutGrid,
} from "lucide-react";
import toast from "react-hot-toast";

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

interface MatchScore {
  skill_score?: number;
  ocean_score?: number;
  total_score?: number;
  match_level?: string;
  harmony_score?: number;
  has_team?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const RANK_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  S: {
    bg: "from-amber-400 to-yellow-500",
    border: "border-amber-400",
    text: "text-amber-900",
  },
  A: {
    bg: "from-rose-500 to-red-600",
    border: "border-rose-500",
    text: "text-white",
  },
  B: {
    bg: "from-purple-500 to-indigo-600",
    border: "border-purple-500",
    text: "text-white",
  },
  C: {
    bg: "from-blue-500 to-cyan-500",
    border: "border-blue-500",
    text: "text-white",
  },
  D: {
    bg: "from-slate-400 to-slate-500",
    border: "border-slate-400",
    text: "text-white",
  },
};

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
    label: "เปิดรับคน",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    icon: Users,
  },
  filled: {
    label: "คนครบแล้ว",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Check,
  },
  in_progress: {
    label: "กำลังลุย",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    icon: Zap,
  },
  completed: {
    label: "สำเร็จ",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: Star,
  },
  failed: {
    label: "ล้มเหลว",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    icon: X,
  },
  cancelled: {
    label: "ยกเลิก",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    icon: X,
  },
};

export default function QuestBoardPage() {
  const router = useRouter();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRank, setFilterRank] = useState<string | null>(null);

  const [userId, setUserId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "history">("active");

  // Fetch quests
  useEffect(() => {
    const storedUserId = localStorage.getItem("myUserId");
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }

    axios
      .get(`${API_URL}/quests`)
      .then((res) => {
        setQuests(res.data.quests);
        // Fetch team analysis for each quest removed - now included in main response
      })
      .catch(() => toast.error("ไม่สามารถโหลด Quest ได้"))
      .finally(() => setLoading(false));
  }, []);

  const filteredQuests = quests.filter((q) => {
    const isHistory = ["completed", "failed", "cancelled"].includes(q.status);
    if (viewMode === "active" && isHistory) return false;
    if (viewMode === "history" && !isHistory) return false;

    if (filterRank && q.rank !== filterRank) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        q.title.toLowerCase().includes(query) ||
        q.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/20 px-3 py-4 md:p-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-2">
            <Scroll className="text-amber-500" />
            Guild Quest Board
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            รับเควสที่เหมาะกับคุณ
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 ">
          {/* View Toggle */}
          <div className="flex bg-white dark:bg-slate-800/20 p-1 rounded-xl shadow-sm ">
            <button
              onClick={() => setViewMode("active")}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${
                viewMode === "active"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <LayoutGrid size={16} /> Active
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${
                viewMode === "history"
                  ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <History size={16} /> History
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาเควส..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Rank Filter */}
          <div className="flex gap-2 flex-wrap">
            {["S", "A", "B", "C", "D"].map((rank) => (
              <button
                key={rank}
                onClick={() => setFilterRank(filterRank === rank ? null : rank)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex-1 sm:flex-none ${
                  filterRank === rank
                    ? `bg-gradient-to-r ${RANK_COLORS[rank].bg} ${RANK_COLORS[rank].text}`
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {rank}
              </button>
            ))}
          </div>

          {/* Create Quest Button */}
          {userId && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg transition"
            >
              <Plus size={18} /> สร้างเควส
            </button>
          )}
        </div>

        {/* Quest Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredQuests.map((quest) => {
            const rankStyle = RANK_COLORS[quest.rank] || RANK_COLORS.C;

            return (
              <div
                key={quest.id}
                className={`relative bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 ${rankStyle.border} shadow-sm hover:shadow-xl transition-all group cursor-pointer`}
                onClick={() => router.push(`/quests/${quest.id}`)}
              >
                {/* Rank Seal */}
                <div
                  className={`absolute -top-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br ${rankStyle.bg} flex items-center justify-center shadow-lg`}
                >
                  <span className={`text-lg font-black ${rankStyle.text}`}>
                    {quest.rank}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 pr-10">
                  {quest.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                  {quest.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />{" "}
                    {quest.deadline
                      ? new Date(quest.deadline).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                        })
                      : "ไม่กำหนด"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {quest.team_size} needed
                  </span>
                  {(() => {
                    const statusInfo =
                      STATUS_LABELS[quest.status] || STATUS_LABELS.open;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${statusInfo.color}`}
                      >
                        <StatusIcon size={10} /> {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {quest.required_skills.slice(0, 4).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-medium flex items-center gap-1"
                    >
                      <Zap
                        size={10}
                        className="fill-indigo-700 dark:fill-indigo-300"
                      />{" "}
                      {skill.name}
                    </span>
                  ))}
                  {quest.optional_skills.slice(0, 2).map((skill, i) => (
                    <span
                      key={`opt-${i}`}
                      className="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded text-[10px] font-medium flex items-center gap-1"
                    >
                      <Star
                        size={10}
                        className="fill-teal-700 dark:fill-teal-300"
                      />{" "}
                      {skill.name}
                    </span>
                  ))}
                </div>

                {/* Leader */}
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200">
                      {CLASS_ICONS[quest.leader_class] || <Star size={14} />}
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 rounded-full p-0.5 border-2 border-white dark:border-slate-800 shadow-sm z-10">
                      <Crown size={10} className="text-white fill-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-800 dark:text-white font-medium">
                      {quest.leader_name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {quest.leader_class}
                    </p>
                  </div>
                </div>

                {/* Team Analysis (Harmony) */}
                {quest.harmony_score !== undefined &&
                  quest.harmony_score > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 dark:text-slate-400">
                          Harmony Score
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {quest.harmony_score}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
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
                  )}

                {/* View Details Button (No Apply) */}
                <button className="w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                  ดูรายละเอียด <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {filteredQuests.length === 0 && (
          <div className="text-center py-16">
            <Scroll
              className="mx-auto mb-4 text-slate-300 dark:text-slate-600"
              size={48}
            />
            <p className="text-slate-500 dark:text-slate-400">ยังไม่มีเควส</p>
          </div>
        )}
      </div>

      {/* Create Quest Modal */}
      {showCreateModal && (
        <CreateQuestModal
          userId={userId!}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newQuest) => {
            setQuests([newQuest, ...quests]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// Create Quest Modal Component
function CreateQuestModal({
  userId,
  onClose,
  onCreated,
}: {
  userId: number;
  onClose: () => void;
  onCreated: (quest: Quest) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!prompt.trim()) {
      toast.error("กรุณาอธิบายงาน");
      return;
    }

    if (new Date(deadline) <= new Date(startDate)) {
      toast.error("Deadline ต้องหลังวันเริ่มงาน");
      return;
    }

    setLoading(true);
    try {
      // Calculate deadline_days from startDate and deadline
      const start = new Date(startDate);
      const end = new Date(deadline);
      const deadlineDays = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );

      const res = await axios.post(`${API_URL}/quests`, {
        prompt,
        deadline_days: deadlineDays,
        leader_id: userId,
        start_date: new Date(startDate).toISOString(),
        deadline: new Date(deadline).toISOString(),
      });
      toast.success("สร้างเควสสำเร็จ!");
      onCreated(res.data);
    } catch (err) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Scroll className="text-amber-500" size={24} />
          สร้าง Quest ใหม่
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              อธิบายงานที่ต้องการ
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="เช่น: หาคนมาช่วยทำ API เชื่อมต่อ Payment Gateway หน่อย งานด่วน 3 วันเสร็จ ขอคนเขียน Python คล่องๆ"
              className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                วันเริ่มงาน
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            💡 AI จะแนะนำจำนวนคนที่เหมาะสมกับงาน
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? "🔮 AI กำลังสร้าง..." : "สร้างเควส"}
          </button>
        </div>
      </div>
    </div>
  );
}
