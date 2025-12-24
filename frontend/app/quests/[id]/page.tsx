"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
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
  Play,
  Calendar,
  Sparkles,
  UserPlus,
  Plus,
  Minus,
} from "lucide-react";
import toast from "react-hot-toast";

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
  accepted_members: {
    id: number;
    name: string;
    character_class: string;
    level: number;
    matching_skills?: { name: string; level: number; type: string }[];
  }[];
  accepted_member_ids: number[];
  start_date: string | null;
  deadline: string | null;
  created_at: string;
}

interface Candidate {
  user_id: number;
  name: string;
  character_class: string;
  level: number;
  match_score: number;
  skill_score: number;
  ocean_score: number;
  match_level: string;
  missing_skills: any[];
  matching_skills?: { name: string; level: number; type: string }[];
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
  open: { label: "เปิดรับคน", color: "bg-blue-500 text-white", icon: Users },
  filled: { label: "คนครบแล้ว", color: "bg-amber-500 text-white", icon: Check },
  in_progress: {
    label: "กำลังลุย",
    color: "bg-purple-500 text-white",
    icon: Zap,
  },
  completed: {
    label: "ภารกิจสำเร็จ",
    color: "bg-emerald-500 text-white",
    icon: Star,
  },
  failed: { label: "ภารกิจล้มเหลว", color: "bg-red-500 text-white", icon: X },
};

export default function QuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [quest, setQuest] = useState<QuestDetail | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const { user } = useAuth();
  const [teamAnalysis, setTeamAnalysis] = useState<any>(null);

  const [filterSkill, setFilterSkill] = useState<string | null>(null);

  const refreshQuest = async () => {
    const res = await axios.get(`${API_URL}/quests/${id}`);
    setQuest(res.data);
  };

  const handleFetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const res = await axios.get(`${API_URL}/quests/${id}/candidates`);
      setCandidates(res.data.candidates);
      if (res.data.candidates.length > 0) {
        toast.success(`พบ ${res.data.candidates.length} คนที่เหมาะสม!`);
      } else {
        toast.error("ไม่พบผู้สมัครที่เหมาะสม");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleTeamSizeChange = async (delta: number) => {
    if (!quest) return;
    try {
      const newSize = quest.team_size + delta;
      await axios.patch(
        `${API_URL}/quests/${id}/team-size?team_size=${newSize}`
      );
      await refreshQuest();
      toast.success(`เปลี่ยนจำนวนทีมเป็น ${newSize} คน`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "ไม่สามารถเปลี่ยนได้");
    }
  };

  const fetchTeamAnalysis = async () => {
    try {
      const res = await axios.get(`${API_URL}/quests/${id}/team-analysis`);
      setTeamAnalysis(res.data);
    } catch (err) {
      console.error("Failed to fetch team analysis");
    }
  };

  useEffect(() => {
    axios
      .get(`${API_URL}/quests/${id}`)
      .then((res) => {
        setQuest(res.data);
        // Fetch team analysis after loading quest
        fetchTeamAnalysis();
      })
      .catch(() => toast.error("ไม่พบเควส"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async (candidateId: number) => {
    try {
      await axios.post(`${API_URL}/quests/${id}/accept/${candidateId}`);
      toast.success("เพิ่มสมาชิกแล้ว! 🎉");
      await refreshQuest();
      await fetchTeamAnalysis(); // Update team analysis
      // Remove from candidates list
      setCandidates(candidates.filter((c) => c.user_id !== candidateId));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    }
  };

  const handleKick = async (memberId: number) => {
    if (!confirm("ต้องการปลดสมาชิกคนนี้ออกจากทีมใช่หรือไม่?")) return;
    try {
      await axios.post(`${API_URL}/quests/${id}/kick/${memberId}`);
      toast.success("ปลดสมาชิกแล้ว");
      await refreshQuest();
      await fetchTeamAnalysis();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    }
  };

  const handleStart = async () => {
    try {
      await axios.post(`${API_URL}/quests/${id}/start`);
      toast.success("เริ่มเควสแล้ว! ⚔️");
      await refreshQuest();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    }
  };

  const handleComplete = async () => {
    try {
      await axios.post(`${API_URL}/quests/${id}/complete`);
      toast.success("เควสสำเร็จ! 🎉");
      router.push(`/quests`);
      await refreshQuest();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    }
  };

  const handleCancel = async () => {
    if (!confirm("ต้องการยกเลิกเควสนี้?")) return;
    try {
      await axios.post(`${API_URL}/quests/${id}/cancel`);
      toast.success("ยกเลิกเควสแล้ว");
      await refreshQuest();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await axios.post(`${API_URL}/quests/${id}/status`, {
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
      await refreshQuest();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "เกิดข้อผิดพลาด");
    }
  };

  if (loading || !quest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const rankStyle = RANK_COLORS[quest.rank] || RANK_COLORS.C;
  const isLeader = user?.id === quest.leader_id;
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/20 px-3 py-4 md:p-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/quests")}
          className="mb-4 flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
        >
          <ChevronLeft size={18} /> กลับไปบอร์ด
        </button>

        <div
          className={`bg-white dark:bg-slate-800 rounded-2xl border-2 ${rankStyle.border} overflow-hidden shadow-lg`}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${rankStyle.bg} p-6 relative`}>
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <span className={`text-2xl font-black ${rankStyle.text}`}>
                {quest.rank}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white pr-16 sm:pr-20 break-words">
              {quest.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-white/80 text-sm">
              <span className="flex items-center gap-1">
                <Calendar size={16} /> {formatDate(quest.start_date)} -{" "}
                {formatDate(quest.deadline)}
              </span>
              <span className="flex items-center gap-1">
                <Users size={16} /> {acceptedCount}/{quest.team_size} คน
                {isLeader &&
                  (quest.status === "open" || quest.status === "filled") && (
                    <span className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleTeamSizeChange(-1)}
                        className="w-5 h-5 rounded bg-white/20 hover:bg-white/40 flex items-center justify-center transition"
                        title="ลดจำนวน"
                      >
                        <Minus size={12} />
                      </button>
                      <button
                        onClick={() => handleTeamSizeChange(1)}
                        className="w-5 h-5 rounded bg-white/20 hover:bg-white/40 flex items-center justify-center transition"
                        title="เพิ่มจำนวน"
                      >
                        <Plus size={12} />
                      </button>
                    </span>
                  )}
              </span>
              {(() => {
                const statusInfo =
                  STATUS_LABELS[quest.status] || STATUS_LABELS.open;
                const StatusIcon = statusInfo.icon;
                return (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusInfo.color}`}
                  >
                    <StatusIcon size={12} /> {statusInfo.label}
                  </span>
                );
              })()}
            </div>

            {/* Leader Controls */}
            {isLeader && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(quest.status === "filled" || quest.status === "open") && (
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleStart()}
                      disabled={acceptedCount < quest.team_size}
                      className="flex-1 sm:flex-none px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-purple-500/30"
                    >
                      <Play size={16} /> เริ่มภารกิจ
                    </button>
                    <button
                      onClick={() => handleCancel()}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition"
                    >
                      <X size={16} /> ยกเลิก
                    </button>
                  </div>
                )}
                {quest.status === "in_progress" && (
                  <>
                    <button
                      onClick={() => handleStatusChange("completed")}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-500/30"
                    >
                      <Star size={16} /> ภารกิจสำเร็จ
                    </button>
                    <button
                      onClick={() => handleStatusChange("failed")}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-rose-500/30"
                    >
                      <X size={16} /> ภารกิจล้มเหลว
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                รายละเอียด
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                {quest.description}
              </p>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                Skills ที่ต้องการ
              </h3>
              <div className="flex flex-wrap gap-2">
                {quest.required_skills.map((skill, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center gap-2"
                  >
                    <Zap
                      size={14}
                      className="text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400"
                    />
                    <span className="text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                      {skill.name}
                    </span>
                    <span className="text-indigo-500 text-xs">
                      Lv.{skill.level}+
                    </span>
                  </div>
                ))}
                {quest.optional_skills.map((skill, i) => (
                  <div
                    key={`opt-${i}`}
                    className="px-3 py-1.5 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center gap-2"
                  >
                    <Star
                      size={14}
                      className="text-teal-600 dark:text-teal-400 fill-teal-600 dark:fill-teal-400"
                    />
                    <span className="text-teal-700 dark:text-teal-300 text-sm font-medium">
                      {skill.name}
                    </span>
                    <span className="text-teal-500 text-xs">
                      Lv.{skill.level}+
                    </span>
                  </div>
                ))}
              </div>
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
                  <p className="text-xs text-slate-500">{quest.leader_class}</p>
                </div>
              </div>
            </div>

            {/* Team Members */}
            {quest.accepted_members && quest.accepted_members.length > 0 && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="text-emerald-500" size={16} />
                  สมาชิกทีม ({quest.accepted_members.length}/{quest.team_size})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {quest.accepted_members.map((member) => (
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
                              {member.character_class} • Lv.{member.level}
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
                            {member.matching_skills.map((skill, i) => (
                              <span
                                key={i}
                                className={`text-[9px] px-1.5 py-0.5 rounded ${
                                  skill.type === "required"
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                    : "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                                }`}
                              >
                                {skill.name} Lv.{skill.level}
                              </span>
                            ))}
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
                  <div className="flex-1 text-center border-r border-slate-100 dark:border-slate-700">
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
                        {teamAnalysis.harmony_score}%
                      </span>
                    </div>
                  </div>

                  {/* Right: Skill Goal */}
                  <div className="flex-1 text-center">
                    <p className="text-xs text-slate-400 mb-1">
                      สกิลครบตามโจทย์
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Zap
                        size={24}
                        className={`${
                          teamAnalysis.skill_coverage.coverage_percent >= 100
                            ? "text-emerald-500 fill-emerald-500"
                            : "text-amber-500 fill-amber-500"
                        }`}
                      />
                      <span
                        className={`text-2xl font-black ${
                          teamAnalysis.skill_coverage.coverage_percent >= 100
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {teamAnalysis.skill_coverage.coverage_percent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scores */}

                {/* Skill Status */}
                <div className="space-y-2">
                  {teamAnalysis.skill_coverage.all_covered && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                      <Check size={14} /> ทีมมี Skills ครบทุกอย่างแล้ว!
                    </div>
                  )}

                  {!teamAnalysis.skill_coverage.all_covered && (
                    <>
                      {teamAnalysis.skill_coverage.covered.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 mb-1">
                            ✅ ครบแล้ว:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {teamAnalysis.skill_coverage.covered.map(
                              (s: any, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-[10px]"
                                >
                                  {s.name} (Lv.{s.has}/{s.required})
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {teamAnalysis.skill_coverage.partial.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 mb-1">
                            ⚠️ ยังไม่พอ:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {teamAnalysis.skill_coverage.partial.map(
                              (s: any, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-[10px]"
                                >
                                  {s.name} (Lv.{s.has}/{s.required})
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {teamAnalysis.skill_coverage.missing.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 mb-1">
                            ❌ ยังขาด:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {teamAnalysis.skill_coverage.missing.map(
                              (s: any, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-[10px]"
                                >
                                  {s.name} (ต้อง Lv.{s.required})
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* AI Candidate Finder - For leaders */}
            {isLeader &&
              (quest.status === "open" || quest.status === "filled") && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Sparkles className="text-amber-500" size={18} /> AI
                      แนะนำทีม
                    </h3>
                    <button
                      onClick={handleFetchCandidates}
                      disabled={loadingCandidates}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:shadow-lg transition disabled:opacity-50"
                    >
                      {loadingCandidates ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <Zap size={16} />
                      )}
                      {loadingCandidates ? "กำลังหา..." : "หาคนที่เหมาะ"}
                    </button>
                  </div>

                  {/* Filter Skills Buttons */}
                  {teamAnalysis?.skill_coverage?.missing?.length > 0 &&
                    candidates.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-2">
                          ค้นหาคนที่มี Skill ที่ขาด:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {/* Show "All" button */}
                          <button
                            onClick={() => setFilterSkill(null)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              filterSkill === null
                                ? "bg-slate-800 text-white dark:bg-white dark:text-slate-800"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                          >
                            ทั้งหมด
                          </button>
                          {teamAnalysis.skill_coverage.missing.map(
                            (s: any, i: number) => (
                              <button
                                key={i}
                                onClick={() =>
                                  setFilterSkill(
                                    filterSkill === s.name ? null : s.name
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                  filterSkill === s.name
                                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                                    : "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-100 dark:border-rose-800"
                                }`}
                              >
                                {s.name}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {candidates.length > 0 && (
                    <div className="space-y-3">
                      {candidates
                        .filter((c) => {
                          const hasMatchingSkills =
                            c.matching_skills && c.matching_skills.length > 0;
                          if (!hasMatchingSkills) return false;

                          if (filterSkill) {
                            return c.matching_skills?.some(
                              (s) => s.name === filterSkill
                            );
                          }
                          return true;
                        })
                        .sort((a, b) => {
                          if (filterSkill) {
                            // If filtering, sort by OCEAN score (compatibility)
                            return b.ocean_score - a.ocean_score;
                          }
                          // Default sort by match_score
                          return b.match_score - a.match_score;
                        })
                        .map((candidate) => {
                          const isAccepted = quest.accepted_member_ids.includes(
                            candidate.user_id
                          );
                          return (
                            <div
                              key={candidate.user_id}
                              className={`p-4 rounded-xl border-2 transition ${
                                isAccepted
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
                                  : "bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                              }`}
                            >
                              {/* Header */}
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className={`shrink-0 ${
                                    CLASS_COLORS[candidate.character_class] ||
                                    "text-slate-500"
                                  }`}
                                >
                                  {CLASS_ICONS[candidate.character_class] || (
                                    <Star size={16} />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white break-words">
                                      {candidate.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {candidate.character_class} • Lv.
                                      {candidate.level}
                                    </p>
                                  </div>
                                </div>

                                <div className="ml-auto flex items-center gap-4">
                                  {/* Accept Button */}
                                  {isAccepted ? (
                                    <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold">
                                      ✓ รับแล้ว
                                    </span>
                                  ) : needsMore ? (
                                    <button
                                      onClick={() =>
                                        handleAccept(candidate.user_id)
                                      }
                                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-bold flex items-center gap-1 hover:shadow-lg transition"
                                    >
                                      <UserPlus size={16} /> รับ
                                    </button>
                                  ) : (
                                    <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-lg text-xs font-bold">
                                      ครบแล้ว
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Score breakdown + Matching Skills */}
                              <div className="mt-3 space-y-2">
                                {candidate.matching_skills &&
                                  candidate.matching_skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      <span className="text-[10px] text-slate-400">
                                        เติมเต็มทีม:
                                      </span>
                                      {/* Deduplicate skills by name */}
                                      {Array.from(
                                        new Set(
                                          (candidate.matching_skills || []).map(
                                            (s) => s.name
                                          )
                                        )
                                      )
                                        .map((name) => {
                                          return candidate.matching_skills?.find(
                                            (s) => s.name === name
                                          );
                                        })
                                        .filter(
                                          (s): s is NonNullable<typeof s> => !!s
                                        )
                                        .map((skill, idx) => (
                                          <span
                                            key={idx}
                                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                              skill.type === "required"
                                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                                : "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                                            }`}
                                          >
                                            {skill.name} Lv.{skill.level}
                                          </span>
                                        ))}
                                    </div>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {candidates.length === 0 && !loadingCandidates && (
                    <div className="text-center py-8 text-slate-400">
                      <Users className="mx-auto mb-2" size={32} />
                      <p className="text-sm">กดปุ่มเพื่อให้ AI หาคนที่เหมาะ</p>
                    </div>
                  )}
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
  );
}
