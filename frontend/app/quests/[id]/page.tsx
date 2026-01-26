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

// ...existing imports...
import ElementalLoader from "@/components/ElementalLoader";
// Note: Imports preserved automatically by ...existing imports... or manual restoration below if needed.
// Ideally I should keep the imports.

// ...existing imports...
// Note: imports above should be maintained.

// ...existing interfaces...

const CLASS_ICONS: Record<string, React.ReactNode> = {
  Mage: <Wand size={20} />,
  Paladin: <Shield size={20} />,
  Warrior: <Sword size={20} />,
  Cleric: <Heart size={20} />,
  Rogue: <Skull size={20} />,
};

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  open: { label: "Pending", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: Users },
  filled: {
    label: "Pending (Ready)",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: Check,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    icon: Zap,
  },
  completed: {
    label: "Finished",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: Star,
  },
  late: { label: "Late", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400", icon: AlertCircle },
  failed: { label: "Failed", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: X },
  cancelled: { label: "Failed", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: X },
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
        <div className="flex flex-col items-center gap-4 min-w-[260px] py-2 font-[family-name:var(--font-line-seed)]">
          <div className="text-center">
            <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center justify-center gap-2">
              เตะออกจากทีม? <span className="text-2xl">👢</span>
            </h3>
            <p className="text-sm text-[var(--muted)] mt-1">
              ต้องการปลดคนนี้ออกจากปาร์ตี้ใช่หรือไม่?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-sm font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--foreground)] rounded-lg transition"
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
          "!bg-[var(--background)] !border !border-black/5 dark:!border-white/5 !shadow-xl !backdrop-blur-xl",
        style: { color: "var(--foreground)" },
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
        <div className="flex flex-col items-center gap-4 min-w-[260px] py-2 font-[family-name:var(--font-line-seed)]">
          <div className="text-center">
            <h3 className="font-bold text-lg text-[var(--foreground)] flex items-center justify-center gap-2">
              ยกเลิกเควส? <span className="text-2xl">❌</span>
            </h3>
            <p className="text-sm text-[var(--muted)] mt-1">
              ภารกิจนี้จะล้มเหลวทันที แน่ใจนะ?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-sm font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--foreground)] rounded-lg transition"
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
          "!bg-[var(--background)] !border !border-black/5 dark:!border-white/5 !shadow-xl !backdrop-blur-xl",
        style: { color: "var(--foreground)" },
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] transition-colors">
        <ElementalLoader />
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-3 py-4 md:p-8 transition-colors font-[family-name:var(--font-line-seed)]">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/quests?view=${returnView}`)}
            className="mb-4 flex items-center gap-1 text-[var(--muted)] hover:text-[var(--foreground)] transition opacity-80 hover:opacity-100"
          >
            <ChevronLeft size={18} /> กลับไปบอร์ด
          </button>

          <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-sm backdrop-blur-sm">
            {/* Header */}
            <div className="p-6 md:p-8 bg-black/5 dark:bg-white/5 relative border-b border-black/5 dark:border-white/5">
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
                    <span className="text-[var(--muted)] text-xs font-medium flex items-center gap-1 opacity-70">
                      <Calendar size={14} /> Created{" "}
                      {new Date(quest.created_at).toLocaleDateString("th-TH")}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)] mb-2 leading-tight">
                    {quest.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--muted)] text-sm opacity-80">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={16} />
                      {formatDate(quest.start_date)} -{" "}
                      {formatDate(quest.deadline)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={16} />
                      {acceptedCount} / {quest.team_size} Members
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-2">
                  รายละเอียด
                </h3>
                <p className="text-[var(--foreground)] opacity-80">
                  {quest.description}
                </p>
              </div>

              {/* Leader */}
              <div className="mb-6 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-2">
                  👑 Quest Leader
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--highlight)] to-[var(--highlight)]/70 p-0.5">
                    <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center shadow text-[var(--foreground)]">
                      {CLASS_ICONS[quest.leader_class] || <Star size={20} />}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-[var(--foreground)]">
                      {quest.leader_name}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {quest.leader_class}
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              {quest.accepted_members && quest.accepted_members.length > 0 && (
                <div className="mb-6 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <Users className="text-emerald-500" size={16} />
                    สมาชิกทีม ({quest.accepted_members.length}/{quest.team_size}
                    )
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {quest.accepted_members.map((member: AcceptedMember) => (
                      <div
                        key={member.id}
                        className="bg-black/5 dark:bg-white/5 rounded-lg p-2"
                      >
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                              {CLASS_ICONS[member.character_class] || (
                                <Star size={14} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[var(--foreground)]">
                                {member.name}
                              </p>
                              <p className="text-[10px] text-[var(--muted)] opacity-80">
                                {member.character_class}
                                {member.department &&
                                  member.department !== "Unknown" && (
                                    <span
                                      className="mx-1 opacity-60"
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
                                className="w-6 h-6 rounded-full hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500 flex items-center justify-center transition"
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
                                        ? "bg-indigo-500/10 text-indigo-500"
                                        : "bg-teal-500/10 text-teal-500"
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
                <div className="mb-6 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <Sparkles className="text-indigo-500" size={16} />
                    Team Analysis
                  </h3>

                  {/* Team Summary - Harmony & Skill Coverage */}
                  <div className="flex items-center gap-4 mb-4 bg-black/5 dark:bg-white/5 p-4 rounded-xl shadow-sm">
                    {/* Left: Team Harmony */}
                    <div className="flex-1 text-center">
                      <p className="text-xs text-[var(--muted)] mb-1 opacity-70">
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
                              : "text-[var(--muted)]"
                          }`}
                        />
                        <span
                          className={`text-2xl font-black ${
                            teamAnalysis.harmony_score >= 80
                              ? "text-rose-500"
                              : teamAnalysis.harmony_score >= 60
                              ? "text-orange-500"
                              : "text-[var(--foreground)]"
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
                  <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleComplete}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm"
                    >
                      <Check size={20} /> ภารกิจสำเร็จ (Complete)
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-3 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 text-[var(--foreground)] hover:text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                    >
                      <X size={20} /> ยุบทีม (Disband)
                    </button>
                  </div>
                )}

              {/* Status Messages */}
              {quest.status === "completed" && (
                <div className="p-4 bg-emerald-500/10 rounded-xl text-center">
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                    🎉 เควสสำเร็จแล้ว!
                  </p>
                </div>
              )}
              {quest.status === "cancelled" && (
                <div className="p-4 bg-red-500/10 rounded-xl text-center">
                  <p className="text-red-600 dark:text-red-400 font-bold">
                    ❌ เควสถูกยกเลิก
                  </p>
                </div>
              )}

              {/* Non-leader view */}
              {!isLeader && (
                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl text-center">
                  <p className="text-[var(--foreground)] opacity-80">
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
