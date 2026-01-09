"use client";
import { use } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import {
  Users,
  Star,
  Shield,
  Sword,
  Wand,
  Heart,
  Skull,
  ChevronLeft,
  Check,
  X,
  Zap,
  Calendar,
  Sparkles,
  AlertCircle,
} from "lucide-react";
// Removed: Play, UserPlus, Plus, Minus
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";

interface MatchingSkill {
  name: string;
  level: number;
  type: string;
}

interface AcceptedMember {
  id: number;
  name: string;
  character_class: string;
  department?: string;
  level: number;
  matching_skills?: MatchingSkill[];
}

interface QuestDetail {
  id: number;
  title: string;
  description: string;
  rank: string;
  required_skills: { name: string; level: number }[];
  optional_skills: { name: string; level: number }[];
  ocean_preference: { high?: string[]; low?: string[] };
  team_size: number;
  leader_id: number;
  leader_name: string;
  leader_class: string;
  status: string;
  accepted_members: AcceptedMember[];
  accepted_member_ids: number[];
  start_date: string | null;
  deadline: string | null;
  created_at: string;
}

// Removed unused Candidate interface

const CLASS_ICONS: Record<string, React.ReactNode> = {
  Mage: <Wand size={20} />,
  Paladin: <Shield size={20} />,
  Warrior: <Sword size={20} />,
  Cleric: <Heart size={20} />,
  Rogue: <Skull size={20} />,
};

const CLASS_COLORS: Record<string, string> = {
  Mage: "text-purple-500",
  Paladin: "text-amber-500",
  Warrior: "text-rose-500",
  Cleric: "text-emerald-500",
  Rogue: "text-blue-500",
};

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  open: { label: "Pending", color: "bg-blue-500 text-white", icon: Users },
  filled: {
    label: "Pending (Ready)",
    color: "bg-amber-500 text-white",
    icon: Check,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-purple-500 text-white",
    icon: Zap,
  },
  completed: {
    label: "Finished",
    color: "bg-emerald-500 text-white",
    icon: Star,
  },
  late: { label: "Late", color: "bg-rose-600 text-white", icon: AlertCircle },
  failed: { label: "Failed", color: "bg-red-500 text-white", icon: X },
  cancelled: { label: "Failed", color: "bg-red-500 text-white", icon: X },
};

export default function QuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnView = searchParams.get("return_view") || "active";
  const { user } = useAuth();

  const queryClient = useQueryClient();

  // 1. Fetch Quest Detail
  const {
    data: quest,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["quest", id],
    queryFn: async () => {
      const res = await api.get(`/quests/${id}`);
      return res.data;
    },
  });

  // 2. Fetch Team Analysis (Enabled if quest exists)
  const { data: teamAnalysis } = useQuery({
    queryKey: ["quest-analysis", id],
    queryFn: async () => {
      const res = await api.get(`/quests/${id}/team-analysis`);
      return res.data;
    },
    enabled: !!quest,
  });

  // 3. Fetch Candidates (Enabled if quest exists and user is leader and status allows)
  const isLeader = user?.id === quest?.leader_id;

  // 3. Candidates fetching removed (Legacy Quest Mode)

  const refreshQuest = () => {
    queryClient.invalidateQueries({ queryKey: ["quest", id] });
    queryClient.invalidateQueries({ queryKey: ["quest-analysis", id] });
    queryClient.invalidateQueries({ queryKey: ["quest-candidates", id] });
    queryClient.invalidateQueries({ queryKey: ["quests"] });
  };

  const handleKick = async (memberId: number) => {
    toast(
      (t) => (
        <div className="flex flex-col items-center gap-4 min-w-[260px] py-2">
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
              เตะออกจากทีม? <span className="text-2xl">👢</span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              ต้องการปลดคนนี้ออกจากปาร์ตี้ใช่หรือไม่?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await api.post(`/quests/${id}/kick/${memberId}`);
                  toast.success("ปลดสมาชิกเรียบร้อยแล้ว");
                  refreshQuest();
                } catch (err: any) {
                  toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
                }
              }}
              className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition transform active:scale-95"
            >
              ปลดเลย
            </button>
          </div>
        </div>
      ),
      {
        duration: 4000,
        className:
          "!bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl",
        style: { color: "inherit" },
      }
    );
  };

  const handleStart = async () => {
    try {
      await api.post(`/quests/${id}/start`);
      toast.success("เริ่มเควสแล้ว! ⚔️");
      refreshQuest();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    }
  };

  const handleComplete = async () => {
    try {
      await api.post(`/quests/${id}/complete`);
      toast.success("เควสสำเร็จ! 🎉");
      refreshQuest();
      router.push(`/quests`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    }
  };

  const handleCancel = async () => {
    toast(
      (t) => (
        <div className="flex flex-col items-center gap-4 min-w-[260px] py-2">
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
              ยกเลิกเควส? <span className="text-2xl">❌</span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              ภารกิจนี้จะล้มเหลวทันที แน่ใจนะ?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg transition"
            >
              ไม่ยกเลิก
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await api.post(`/quests/${id}/cancel`);
                  toast.success("ยกเลิกเควสเรียบร้อยแล้ว");
                  refreshQuest();
                } catch (err: any) {
                  toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
                }
              }}
              className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition transform active:scale-95"
            >
              ยกเลิกเลย
            </button>
          </div>
        </div>
      ),
      {
        duration: 4000,
        className:
          "!bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl",
        style: { color: "inherit" },
      }
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.post(`/quests/${id}/status`, {
        user_id: user?.id,
        status: newStatus,
      });
      if (newStatus === "completed") {
        toast.success("ภารกิจสำเร็จ! ยินดีด้วย 🎉");
      } else if (newStatus === "failed") {
        toast.error("ภารกิจล้มเหลว... อย่าเพิ่งท้อนะ 💀");
      } else {
        toast.success("สถานะอัปเดตแล้ว");
      }
      refreshQuest();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    }
  };

  if (loading || !quest) {
    if (error)
      return (
        <div className="p-8 text-center text-red-500">Error loading quest</div>
      );
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Helper for status - moved here to have access to quest
  const getDisplayStatus = (q: QuestDetail) => {
    if (["completed", "failed", "cancelled"].includes(q.status))
      return q.status;
    const now = new Date();
    const startDate = q.start_date ? new Date(q.start_date) : null;
    const deadline = q.deadline ? new Date(q.deadline) : null;
    if (deadline && now > deadline) return "late";
    if (q.status === "filled" && startDate && now >= startDate) {
      return "in_progress";
    }
    return q.status;
  };

  // handleTeamSizeChange removed (Legacy unused)

  // Re-declare isLeader

  const acceptedCount = quest.accepted_member_ids.length;
  const needsMore = acceptedCount < quest.team_size;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "ไม่กำหนด";
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-amber-500";
    if (score >= 60) return "text-emerald-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900/20 px-3 py-4 md:p-8 transition-colors">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/quests?view=${returnView}`)}
            className="mb-4 flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <ChevronLeft size={18} /> กลับไปบอร์ด
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-6 md:p-8 bg-white dark:bg-slate-800 relative border-b border-slate-100 dark:border-slate-700">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {(() => {
                      const displayStatus = getDisplayStatus(quest);
                      const statusInfo =
                        STATUS_LABELS[displayStatus] || STATUS_LABELS.open;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${statusInfo.color}`}
                        >
                          <StatusIcon size={12} /> {statusInfo.label}
                        </span>
                      );
                    })()}
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-medium flex items-center gap-1">
                      <Calendar size={14} /> Created{" "}
                      {new Date(quest.created_at).toLocaleDateString("th-TH")}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2 leading-tight">
                    {quest.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500 dark:text-slate-400 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={16} className="text-slate-400" />
                      {formatDate(quest.start_date)} -{" "}
                      {formatDate(quest.deadline)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={16} className="text-slate-400" />
                      {acceptedCount} / {quest.team_size} Members
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                  รายละเอียด
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {quest.description}
                </p>
              </div>

              {/* Leader */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                  👑 Quest Leader
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center shadow text-slate-600 dark:text-white">
                      {CLASS_ICONS[quest.leader_class] || <Star size={20} />}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">
                      {quest.leader_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {quest.leader_class}
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              {quest.accepted_members && quest.accepted_members.length > 0 && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="text-emerald-500" size={16} />
                    สมาชิกทีม ({quest.accepted_members.length}/{quest.team_size}
                    )
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {quest.accepted_members.map((member: AcceptedMember) => (
                      <div
                        key={member.id}
                        className="bg-white dark:bg-slate-700 rounded-lg p-2"
                      >
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-800 dark:text-emerald-200">
                              {CLASS_ICONS[member.character_class] || (
                                <Star size={14} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-white">
                                {member.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {member.character_class}
                                {member.department &&
                                  member.department !== "Unknown" && (
                                    <span
                                      className="mx-1 text-slate-400"
                                      title={member.department}
                                    >
                                      •{" "}
                                      {member.department.length > 20
                                        ? member.department.slice(0, 20) + "..."
                                        : member.department}
                                    </span>
                                  )}
                                <span className="mx-1">•</span> Lv.
                                {member.level}
                              </p>
                            </div>
                          </div>

                          {isLeader &&
                            (quest.status === "open" ||
                              quest.status === "filled") && (
                              <button
                                onClick={() => handleKick(member.id)}
                                className="w-6 h-6 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 flex items-center justify-center transition"
                                title="นำออกจากทีม"
                              >
                                <X size={14} />
                              </button>
                            )}
                        </div>

                        {/* Member Skills - Only related to quest */}
                        {member.matching_skills &&
                          member.matching_skills.length > 0 && (
                            <div className="mt-2 pl-10 flex flex-wrap gap-1">
                              {member.matching_skills.map(
                                (skill: MatchingSkill, i: number) => (
                                  <span
                                    key={i}
                                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                                      skill.type === "required"
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                        : "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                                    }`}
                                  >
                                    {skill.name}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Analysis - Show when team has members */}
              {teamAnalysis?.has_team && (
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles className="text-indigo-500" size={16} />
                    Team Analysis
                  </h3>

                  {/* Team Summary - Harmony & Skill Coverage */}
                  <div className="flex items-center gap-4 mb-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                    {/* Left: Team Harmony */}
                    <div className="flex-1 text-center">
                      <p className="text-xs text-slate-400 mb-1">
                        ความเข้ากันได้
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Heart
                          size={24}
                          className={`${
                            teamAnalysis.harmony_score >= 80
                              ? "text-rose-500 fill-rose-500"
                              : teamAnalysis.harmony_score >= 60
                              ? "text-orange-500 fill-orange-500"
                              : "text-slate-400"
                          }`}
                        />
                        <span
                          className={`text-2xl font-black ${
                            teamAnalysis.harmony_score >= 80
                              ? "text-rose-600 dark:text-rose-400"
                              : teamAnalysis.harmony_score >= 60
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {Math.round(teamAnalysis.harmony_score)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scores */}
                </div>
              )}

              {/* Leader Actions */}
              {isLeader &&
                (quest.status === "open" ||
                  quest.status === "filled" ||
                  quest.status === "in_progress") && (
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleComplete}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm"
                    >
                      <Check size={20} /> ภารกิจสำเร็จ (Complete)
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-3 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                    >
                      <X size={20} /> ยุบทีม (Disband)
                    </button>
                  </div>
                )}

              {/* Status Messages */}
              {quest.status === "completed" && (
                <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-center">
                  <p className="text-emerald-700 dark:text-emerald-300 font-bold">
                    🎉 เควสสำเร็จแล้ว!
                  </p>
                </div>
              )}
              {quest.status === "cancelled" && (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-center">
                  <p className="text-red-700 dark:text-red-300 font-bold">
                    ❌ เควสถูกยกเลิก
                  </p>
                </div>
              )}

              {/* Non-leader view */}
              {!isLeader && (
                <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-center">
                  <p className="text-slate-600 dark:text-slate-300">
                    {quest.accepted_member_ids.includes(user?.id || 0)
                      ? "✓ คุณได้รับเลือกเข้าทีมแล้ว!"
                      : "รอ Quest Leader เลือกสมาชิก"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
