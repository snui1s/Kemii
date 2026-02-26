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
  id: string; // ULID
  name: string;
  character_class: string;
  department?: string;
  level: number;
  matching_skills?: MatchingSkill[];
}

interface QuestDetail {
  id: string; // ULID
  title: string;
  description: string;
  rank: string;
  required_skills: { name: string; level: number }[];
  optional_skills: { name: string; level: number }[];
  ocean_preference: { high?: string[]; low?: string[] };
  team_size: number;
  leader_id: string; // ULID
  leader_name: string;
  leader_class: string;
  status: string;
  accepted_members: AcceptedMember[];
  accepted_member_ids: string[]; // ULID
  start_date: string | null;
  deadline: string | null;
  created_at: string;
}

// Removed unused Candidate interface

// ...existing imports...
import ElementalLoader from "@/components/ElementalLoader";

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

const getClassColors = (className: string) => {
  const safe = (className || "").trim();
  if (safe.includes("Mage") || safe.includes("เวทย์")) return "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20";
  if (safe.includes("Paladin") || safe.includes("อัศวิน")) return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (safe.includes("Warrior") || safe.includes("นักรบ")) return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
  if (safe.includes("Cleric") || safe.includes("นักบวช")) return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (safe.includes("Rogue") || safe.includes("โจร")) return "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
  return "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20";
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

  const handleKick = async (memberId: string) => {
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
          "!bg-[var(--background)] !border !border-black/5 dark:!border-white/5 !shadow-xl !backdrop-blur-xl !text-[var(--foreground)]",
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
          "!bg-[var(--background)] !border !border-black/5 dark:!border-white/5 !shadow-xl !backdrop-blur-xl !text-[var(--foreground)]",
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
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-3 py-4 md:p-8 transition-colors font-[family-name:var(--font-line-seed)] pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/quests?view=${returnView}`)}
            className="mb-4 flex items-center gap-1 text-[var(--muted)] hover:text-[var(--foreground)] transition opacity-80 hover:opacity-100 font-medium text-sm"
          >
            <ChevronLeft size={16} /> กลับไปบอร์ด
          </button>

          <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className="p-6 border-b border-black/5 dark:border-white/5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {(() => {
                      const displayStatus = getDisplayStatus(quest);
                      const statusInfo =
                        STATUS_LABELS[displayStatus] || STATUS_LABELS.open;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <div
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusInfo.color}`}
                        >
                          <StatusIcon size={12} strokeWidth={2.5} /> {statusInfo.label}
                        </div>
                      );
                    })()}
                    <span className="text-[var(--muted)] text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 opacity-60">
                      <Calendar size={12} />
                      Created {new Date(quest.created_at).toLocaleDateString("th-TH")}
                    </span>
                  </div>

                  <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3 leading-tight tracking-tight">
                    {quest.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--muted)] text-xs font-semibold opacity-70">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="opacity-70" />
                      {formatDate(quest.start_date)} - {formatDate(quest.deadline)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={14} className="opacity-70" />
                      {acceptedCount} / {quest.team_size} Members
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-xs uppercase font-bold text-[var(--muted)] mb-3 tracking-wider opacity-70">
                  รายละเอียด
                </h3>
                <p className="text-[var(--foreground)] text-sm leading-relaxed opacity-90 font-medium">
                  {quest.description}
                </p>
              </div>

              {/* Leader */}
              <div className="mb-8">
                <h3 className="text-xs uppercase font-bold text-[var(--muted)] mb-3 tracking-wider opacity-70">
                  Quest Leader
                </h3>
                <div className={`flex items-center gap-3 p-3 rounded-xl border w-fit pr-6 ${getClassColors(quest.leader_class)}`}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--background)]/50 mix-blend-overlay">
                    {CLASS_ICONS[quest.leader_class] || <Star size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight leading-none">
                      {quest.leader_name}
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-80">
                      {quest.leader_class}
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              {quest.accepted_members && quest.accepted_members.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase font-bold text-[var(--muted)] tracking-wider opacity-70">
                      สมาชิกทีม
                    </h3>
                    <span className="text-[10px] font-bold bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-md text-[var(--foreground)]">
                      {quest.accepted_members.length}/{quest.team_size}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {quest.accepted_members.map((member: AcceptedMember) => (
                      <div
                        key={member.id}
                        className={`rounded-xl border p-3 flex flex-col gap-3 transition-all ${getClassColors(member.character_class)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--background)]/50 mix-blend-overlay">
                              {CLASS_ICONS[member.character_class] || (
                                <Star size={18} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold tracking-tight leading-none">
                                {member.name}
                              </p>
                              <p className="text-[10px] font-bold mt-1 uppercase tracking-wider opacity-80">
                                {member.character_class}
                                <span className="mx-1.5 opacity-50">•</span> Lv.{member.level}
                              </p>
                            </div>
                          </div>

                          {isLeader &&
                            (quest.status === "open" ||
                              quest.status === "filled") && (
                              <button
                                onClick={() => handleKick(member.id)}
                                className="w-7 h-7 rounded-md hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors opacity-50 hover:opacity-100"
                                title="นำออกจากทีม"
                              >
                                <X size={14} />
                              </button>
                            )}
                        </div>

                        {/* Member Skills */}
                        {member.matching_skills && member.matching_skills.length > 0 && (
                          <div className="pt-2 border-t border-[currentColor]/10 flex flex-wrap gap-1.5 opacity-90">
                            {member.matching_skills.map(
                              (skill: MatchingSkill, i: number) => (
                                <span
                                  key={i}
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                    skill.type === "required"
                                      ? "bg-[currentColor]/20"
                                      : "bg-[currentColor]/5"
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

              {/* Team Analysis */}
              {teamAnalysis?.has_team && (
                <div className="mb-8">
                  <h3 className="text-xs uppercase font-bold text-[var(--muted)] tracking-wider mb-3 opacity-70">
                    Team Analysis
                  </h3>

                  <div className="flex items-center justify-between gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <Heart
                        size={20}
                        className={`${
                          teamAnalysis.harmony_score >= 80
                            ? "text-emerald-500 fill-emerald-500/20"
                            : teamAnalysis.harmony_score >= 60
                            ? "text-amber-500 fill-amber-500/20"
                            : "text-[var(--muted)]"
                        }`}
                      />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] opacity-80">
                           Harmony
                        </p>
                        <span
                          className={`text-lg font-bold leading-none block mt-0.5 ${
                            teamAnalysis.harmony_score >= 80
                              ? "text-emerald-500"
                              : teamAnalysis.harmony_score >= 60
                              ? "text-amber-500"
                              : "text-[var(--foreground)]"
                          }`}
                        >
                          {Math.round(teamAnalysis.harmony_score)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Visual Bar representation */}
                    <div className="flex-1 max-w-[200px] h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden hidden sm:block">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 delay-300 ${
                           teamAnalysis.harmony_score >= 80 
                            ? "bg-emerald-500" 
                            : teamAnalysis.harmony_score >= 60
                            ? "bg-amber-500"
                            : "bg-red-500"
                         }`}
                         style={{ width: `${teamAnalysis.harmony_score}%` }}
                       />
                    </div>
                  </div>
                </div>
              )}

              {/* Leader Actions (Desktop) */}
              {isLeader &&
                (quest.status === "open" ||
                  quest.status === "filled" ||
                  quest.status === "in_progress") && (
                  <div className="hidden md:flex mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleComplete}
                      className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
                    >
                      <Check size={16} strokeWidth={2.5} /> ปิดภารกิจ (Complete)
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 text-[var(--foreground)] border border-transparent rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
                    >
                      <X size={16} strokeWidth={2.5} /> ยุบปาร์ตี้ (Disband)
                    </button>
                  </div>
                )}

              {/* Status Messages */}
              {quest.status === "completed" && (
                <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center mt-8">
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    <Check size={20} strokeWidth={3} /> Quest Completed
                  </p>
                </div>
              )}
              {quest.status === "cancelled" && (
                <div className="p-6 bg-red-500/10 rounded-2xl border border-red-500/20 text-center mt-8">
                  <p className="text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    <X size={20} strokeWidth={3} /> Quest Cancelled
                  </p>
                </div>
              )}

              {/* Non-leader view */}
              {!isLeader && quest.accepted_member_ids.includes(user?.id || 0) && (
                <div className="p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 text-center mt-8">
                  <p className="text-[var(--foreground)] font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    <Check size={18} /> You are in this party
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leader Actions (Mobile Sticky) */}
      {isLeader &&
        (quest.status === "open" ||
          quest.status === "filled" ||
          quest.status === "in_progress") && (
          <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex gap-2 animate-in slide-in-from-bottom-2">
            <button
              onClick={handleCancel}
              className="px-4 h-12 bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 text-[var(--foreground)] rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center hover:bg-red-500/10 hover:text-red-500"
            >
              <X size={20} />
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 h-12 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-emerald-500/20 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} strokeWidth={2.5} /> สำเร็จภารกิจ
            </button>
          </div>
        )}
    </ProtectedRoute>
  );
}
