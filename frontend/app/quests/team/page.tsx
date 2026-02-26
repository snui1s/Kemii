"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  Briefcase,
  Users,
  Calendar,
  Sparkles,
  Loader2,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Trophy,
  Filter,
  Sword,
  Shield,
  Wand,
  Heart,
  Skull,
  Scroll,
} from "lucide-react";
import toast from "react-hot-toast";
import { DEPARTMENTS, matchesDepartment } from "@/data/departments";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ElementalLoader from "@/components/ElementalLoader";

interface RequirementRow {
  id: string;
  deptId: string;
  count: number;
}

const CLASS_ICONS: Record<string, React.ReactNode> = {
  Mage: <Wand size={16} />,
  Paladin: <Shield size={16} />,
  Warrior: <Sword size={16} />,
  Cleric: <Heart size={16} />,
  Rogue: <Skull size={16} />,
};

const CLASS_COLORS: Record<string, string> = {
  Mage: "text-purple-500",
  Paladin: "text-amber-500",
  Warrior: "text-rose-500",
  Cleric: "text-emerald-500",
  Rogue: "text-blue-500",
};

interface SmartQuestUser {
  id: string;
  name: string;
  character_class: string;
  level: number;
  skills: string | { name: string; level: number }[];
  is_available: boolean;
  ocean_scores?: {
    O: number;
    C: number;
    E: number;
    E_score?: number;
    A: number;
    N: number;
  };
  // Fallback for raw flattened scores
  ocean_openness?: number;
  ocean_conscientiousness?: number;
  ocean_extraversion?: number;
  ocean_agreeableness?: number;
  ocean_neuroticism?: number;
  [key: string]: any; // Allow index access for dynamic ocean_[trait]
}

interface GeneratedTeam {
  members: SmartQuestUser[];
  harmony_score: number;
  raw_kemii_score: number;
}

export default function SmartQuestPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const { data: allUsers = [], isLoading: loadingConfig } = useQuery<
    SmartQuestUser[]
  >({
    queryKey: ["users", "roster"],
    queryFn: async () => {
      const res = await api.get("/users/roster");
      return res.data;
    },
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [isInputsCollapsed, setIsInputsCollapsed] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const resultsHeaderRef = useRef<HTMLDivElement>(null);
  const [requirements, setRequirements] = useState<RequirementRow[]>([
    { id: "1", deptId: "", count: 1 },
  ]);

  const [selectedPoolIds, setSelectedPoolIds] = useState<Set<string>>(
    new Set()
  );
  const [generatedTeam, setGeneratedTeam] = useState<GeneratedTeam | null>(
    null
  );
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [teamAnalysisText, setTeamAnalysisText] = useState<string | null>(null);

  const candidates = useMemo(() => {
    const targetDeptIds = new Set(
      requirements.filter((r) => r.deptId).map((r) => r.deptId)
    );

    if (targetDeptIds.size === 0) return [];

    return allUsers
      .filter((user) => {
        const skills =
          typeof user.skills === "string"
            ? JSON.parse(user.skills)
            : user.skills || [];

        return Array.from(targetDeptIds).some((deptId) => {
          const deptDef = DEPARTMENTS.find((d) => d.id === deptId);
          if (!deptDef) return false;
          return skills.some((s: any) => matchesDepartment(s.name, deptDef));
        });
      })
      .sort((a, b) => {
        if (a.is_available === b.is_available) return 0;
        return a.is_available ? -1 : 1;
      });
  }, [allUsers, requirements]);

  useEffect(() => {
    setSelectedPoolIds((prev) => {
      const next = new Set(prev);
      candidates.forEach((c) => {
        if (c.is_available) next.add(c.id);
      });
      return next;
    });
  }, [candidates.length]);

  const deptAvailabilityMap = useMemo(() => {
    const map: Record<string, number> = {};
    DEPARTMENTS.forEach((dept) => {
      map[dept.id] = allUsers.filter((u) => {
        if (!u.is_available) return false;
        const skills =
          typeof u.skills === "string" ? JSON.parse(u.skills) : u.skills || [];
        return skills.some((s: any) => matchesDepartment(s.name, dept));
      }).length;
    });
    return map;
  }, [allUsers]);

  const addRow = () => {
    setRequirements([
      ...requirements,
      { id: Date.now().toString(), deptId: "", count: 1 },
    ]);
  };

  const removeRow = (id: string) => {
    setRequirements(requirements.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: keyof RequirementRow, value: any) => {
    setRequirements(
      requirements.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const toggleUser = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user && !user.is_available) {
      toast.error("พนักงานคนนี้ติดภารกิจอยู่ ไม่สามารถเลือกได้");
      return;
    }

    const next = new Set(selectedPoolIds);
    if (next.has(userId)) {
      const totalRequired = requirements.reduce(
        (sum, r) => sum + (r.deptId ? r.count : 0),
        0
      );
      if (next.size <= totalRequired) {
        toast.error(`ต้องมีผู้สมัครอย่างน้อย ${totalRequired} คนตามที่ระบุ`);
        return;
      }
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelectedPoolIds(next);
  };

  const toggleAll = () => {
    if (
      selectedPoolIds.size >= candidates.filter((u) => u.is_available).length
    ) {
      setSelectedPoolIds(new Set());
    } else {
      const allAvailableIds = new Set(
        candidates.filter((u) => u.is_available).map((u) => u.id)
      );
      setSelectedPoolIds(allAvailableIds);
    }
  };

  const getUserDepartments = (user: any) => {
    const skills =
      typeof user.skills === "string"
        ? JSON.parse(user.skills)
        : user.skills || [];

    return DEPARTMENTS.filter((d) =>
      skills.some((s: any) => matchesDepartment(s.name, d))
    );
  };

  const handleGenerate = async () => {
    if (!projectName || !startDate || !deadline) {
      toast.error("กรุณากรอกชื่อโปรเจค วันเริ่ม และวันส่งมอบงาน");
      return;
    }
    const validReqs = requirements.filter((r) => r.deptId);
    if (validReqs.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 แผนก");
      return;
    }
    if (selectedPoolIds.size === 0) {
      toast.error("กรุณาเลือกพนักงานในตารางอย่างน้อย 1 คน");
      return;
    }

    setAnalyzing(true);
    setGeneratedTeam(null);
    setTeamAnalysisText(null); // Clear previous analysis

    try {
      const payload = {
        requirements: validReqs.map((r) => ({
          department_id: r.deptId,
          count: r.count,
        })),
        candidate_ids: Array.from(selectedPoolIds),
      };

      const res = await api.post("/teams/preview", payload);

      if (!res.data.members || res.data.members.length === 0) {
        toast.error("ไม่สามารถจัดทีมได้ตามเงื่อนไข (ลองเปลี่ยนคนหรือลดสเปคลง)");
        setGeneratedTeam(null);
        return;
      }

      setGeneratedTeam(res.data);
      // Scroll to results header on mobile/desktop
      setIsInputsCollapsed(true); // Auto collapse inputs on mobile
      setTimeout(() => {
        resultsHeaderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      // Calculate Averages for AI Analysis
      const members = res.data.members;
      const avgO =
        members.reduce(
          (sum: number, m: any) => sum + (m.ocean_scores?.O || 0),
          0
        ) / members.length;
      const avgC =
        members.reduce(
          (sum: number, m: any) => sum + (m.ocean_scores?.C || 0),
          0
        ) / members.length;
      const avgE =
        members.reduce(
          (sum: number, m: any) => sum + (m.ocean_scores?.E || 0),
          0
        ) / members.length;
      const avgA =
        members.reduce(
          (sum: number, m: any) => sum + (m.ocean_scores?.A || 0),
          0
        ) / members.length;
      const avgN =
        members.reduce(
          (sum: number, m: any) => sum + (m.ocean_scores?.N || 0),
          0
        ) / members.length;

      // Trigger AI Analysis
      setIsAnalyzingText(true);
      setTeamAnalysisText(null);

      api
        .post("/teams/analyze", {
          score: Math.round(res.data.harmony_score),
          avg_o: avgO,
          avg_c: avgC,
          avg_e: avgE,
          avg_a: avgA,
          avg_n: avgN,
        })
        .then((aiRes) => setTeamAnalysisText(aiRes.data.analysis))
        .catch((e) => console.error("AI Analysis Failed", e))
        .finally(() => setIsAnalyzingText(false));

      // Debug: Show JSON format
      const debugMembers = res.data.members.map((m: any) => ({
        user: m.name,
        o: m.ocean_scores?.O || 0,
        c: m.ocean_scores?.C || 0,
        e: m.ocean_scores?.E || 0,
        a: m.ocean_scores?.A || 0,
        n: m.ocean_scores?.N || 0,
      }));

      console.log(
        "Team Generation Debug:",
        JSON.stringify(debugMembers, null, 2)
      );

      toast.success("วิเคราะห์ทีมเสร็จสิ้น! 🎉");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error("เกิดข้อผิดพลาดในการวิเคราะห์");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTryAgain = () => {
    setGeneratedTeam(null);
    setTeamAnalysisText(null);
  };

  const handleConfirmTeam = async () => {
    if (!generatedTeam) return;
    try {
      const payload = {
        title: projectName,
        description: projectDescription,
        deadline: new Date(deadline).toISOString(),
        start_date: new Date(startDate).toISOString(),
        leader_id: currentUser?.id || "",
        requirements: requirements
          .filter((r) => r.deptId)
          .map((r) => ({ department_id: r.deptId, count: r.count })),
        member_ids: generatedTeam.members.map((m: any) => m.id),
        status: "filled",
      };
      await api.post("/teams/confirm", payload);
      toast.success("สร้างทีมสำเร็จ!");
      router.push("/quests");
    } catch (err) {
      toast.error("ยืนยันทีมล้มเหลว");
    }
  };

  const handleRemoveFromPreview = (memberId: string) => {
    if (!generatedTeam) return;

    toast(
      (t) => (
        <div className="flex flex-col items-center gap-4 min-w-[260px] py-2">
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
              เอาออกจากทีม? <span className="text-2xl">🦶</span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              ต้องการเอาสมาชิกคนนี้ออกจากผลการวิเคราะห์ใช่หรือไม่?
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
              onClick={() => {
                toast.dismiss(t.id);
                setGeneratedTeam((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    members: prev.members.filter((m) => m.id !== memberId),
                  };
                });
                toast.success(
                  "เอาออกแล้ว (กรุณากดวิเคราะห์ใหม่เพื่อให้ผลแม่นยำ)"
                );
              }}
              className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition transform active:scale-95"
            >
              เอาออกเลย
            </button>
          </div>
        </div>
      ),
      {
        duration: 4000,
        className:
          "!bg-[var(--background)]/95 !backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-2xl text-[var(--foreground)]",
        style: { color: "inherit" },
      }
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] flex flex-col font-[family-name:var(--font-line-seed)] selection:bg-[var(--highlight)]/30 text-[var(--foreground)]">
        {/* Main Split Layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] md:overflow-hidden">
          {/* === LEFT PANEL: INPUTS (40%) === */}
          <div className="w-full md:w-[400px] lg:w-[450px] p-8 bg-[var(--background)] border-r border-black/5 dark:border-white/5 md:overflow-y-auto z-20 md:shadow-none flex flex-col">
            <div className="flex-1 space-y-10">
              {/* Header */}
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--highlight)] flex items-center justify-center shadow-lg shadow-[var(--highlight)]/20 mb-4">
                  <Sparkles
                    className="text-white"
                    size={20}
                    strokeWidth={1.5}
                  />
                </div>
                <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
                  ระบบจัดปาร์ตี้
                </h1>
                <p className="text-[var(--muted)] text-sm leading-relaxed opacity-80">
                  ระบุรายละเอียดโปรเจกต์และโครงสร้างทีม <br />
                  AI
                  ของเราจะคัดเลือกคนที่เหมาะสมที่สุดทั้งความสามารถและความเข้ากันได้
                </p>
              </div>

              {/* Mobile Collapse Toggle */}
              <button
                onClick={() => setIsInputsCollapsed(!isInputsCollapsed)}
                className="md:hidden w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors border-b border-black/5 dark:border-white/5 mb-4"
              >
                {isInputsCollapsed ? (
                  <>
                    <Plus size={16} /> แสดงข้อมูลภารกิจ & ทีม
                  </>
                ) : (
                  <>
                    <Minus size={16} /> ซ่อนข้อมูลภารกิจ & ทีม
                  </>
                )}
              </button>

              <div className={`${isInputsCollapsed ? 'hidden md:block' : 'block'} space-y-10`}>
                {/* Project Info */}
                <div className="space-y-5 animate-in slide-in-from-left-2 duration-500 delay-100">
                <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--muted)] flex items-center gap-2 opacity-70">
                  <Scroll size={14} className="text-[var(--highlight)]" /> ข้อมูลภารกิจ
                  (Quest Info)
                </h2>
                <div className="space-y-4">
                  <div className="group relative">
                    <input
                      type="text"
                      placeholder="ชื่อภารกิจ"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="peer w-full px-0 py-2 bg-transparent border-b border-black/10 dark:border-white/10 text-[var(--foreground)] focus:border-[var(--highlight)] outline-none transition-all placeholder:text-[var(--muted)]/40 font-medium text-lg"
                    />
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--highlight)] transition-all peer-focus:w-full" />
                  </div>

                  <div className="group relative pt-2">
                    <label className="text-[10px] uppercase font-bold text-[var(--muted)] group-focus-within:text-[var(--highlight)] transition-colors mb-1 block">
                      รายละเอียด (Description)
                    </label>
                    <textarea
                      placeholder="ระบุขอบเขตงาน, เป้าหมาย หรือสิ่งที่ต้องทำ..."
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      className="peer w-full px-0 py-2 bg-transparent border-b border-black/10 dark:border-white/10 text-[var(--foreground)] focus:border-[var(--highlight)] outline-none transition-all placeholder:text-[var(--muted)]/40 text-sm resize-none h-20"
                    />
                    <div className="absolute bottom-1.5 left-0 w-0 h-0.5 bg-[var(--highlight)] transition-all peer-focus:w-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 group">
                      <label className="text-[10px] uppercase font-bold text-[var(--muted)] group-focus-within:text-[var(--highlight)] transition-colors">
                        วันเริ่ม
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full py-2 bg-transparent border-b border-black/10 dark:border-white/10 focus:border-[var(--highlight)] outline-none transition text-sm font-medium text-[var(--foreground)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 group">
                      <label className="text-[10px] uppercase font-bold text-[var(--muted)] group-focus-within:text-pink-500 transition-colors">
                        กำหนดส่ง
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={deadline}
                          min={
                            startDate || new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full py-2 bg-transparent border-b border-black/10 dark:border-white/10 focus:border-pink-500 outline-none transition text-sm font-medium text-[var(--foreground)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Requirements */}
              <div className="space-y-5 animate-in slide-in-from-left-2 duration-500 delay-200">
                <div className="flex justify-between items-end">
                  <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--muted)] flex items-center gap-2 opacity-70">
                    <Users size={14} className="text-[var(--highlight)]" /> จัดปาร์ตี้
                    (Party Setup)
                  </h2>
                  <button
                    onClick={addRow}
                    className="text-[10px] font-bold bg-[var(--highlight)]/10 text-[var(--highlight)] hover:bg-[var(--highlight)]/20 rounded-full px-3 py-1 transition flex items-center gap-1"
                  >
                    <Plus size={12} strokeWidth={3} /> เพิ่มตำแหน่ง
                  </button>
                </div>

                <div className="space-y-3">
                  {requirements.map((row, idx) => {
                    const availableCount = row.deptId
                      ? deptAvailabilityMap[row.deptId] || 0
                      : 0;

                    const availableOptions = DEPARTMENTS.filter((d) => {
                      const isSelectedInOtherRow = requirements.some(
                        (r) => r.id !== row.id && r.deptId === d.id
                      );
                      return !isSelectedInOtherRow;
                    });

                    return (
                      <div
                        key={row.id}
                        className="group flex gap-3 items-center p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-[var(--highlight)]/30 transition-all backdrop-blur-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <Select
                            value={row.deptId || ""}
                            onValueChange={(val) =>
                              updateRow(row.id, "deptId", val)
                            }
                          >
                            <SelectTrigger className="w-full bg-transparent dark:bg-transparent border-none p-0 h-auto text-sm font-semibold text-[var(--foreground)] focus:ring-0 shadow-none">
                              <SelectValue placeholder="เลือกแผนก" />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--background)]/95 backdrop-blur-xl border-black/5 dark:border-white/5 text-[var(--foreground)] shadow-xl">
                              {availableOptions.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.label || d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {row.deptId && (
                            <p className="text-[10px] text-[var(--muted)] mt-1">
                              ว่างตอนนี้:{" "}
                              <span className="font-bold text-emerald-500">
                                {availableCount}
                              </span>{" "}
                              คน
                            </p>
                          )}
                        </div>

                        <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10" />

                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              const val = Math.max(1, row.count - 1);
                              updateRow(row.id, "count", val);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-l-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--muted)] transition-colors border border-r-0 border-black/5 dark:border-white/5"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={row.deptId ? availableCount : undefined}
                            value={row.count}
                            onChange={(e) => {
                              let val = parseInt(e.target.value) || 0;
                              if (val < 1) val = 1;
                              if (row.deptId && val > availableCount)
                                val = availableCount;
                              updateRow(row.id, "count", val);
                            }}
                            className="w-10 h-7 bg-transparent border-y border-black/5 dark:border-white/5 text-xs font-bold text-center text-[var(--foreground)] outline-none focus:border-[var(--highlight)]/50 z-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => {
                              let val = row.count + 1;
                              if (row.deptId && val > availableCount)
                                val = availableCount;
                              updateRow(row.id, "count", val);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-r-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--muted)] transition-colors border border-l-0 border-black/5 dark:border-white/5"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {requirements.length > 1 && (
                          <button
                            onClick={() => removeRow(row.id)}
                            className="p-1.5 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all ml-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              </div>
            </div>

            {/* Action Area (Sticky Bottom on Desktop, Hidden on Mobile) */}
            <div className="hidden md:block mt-8 pt-6 border-t border-black/5 dark:border-white/5">
              {!generatedTeam ? (
                <button
                  onClick={handleGenerate}
                  disabled={analyzing}
                  className="w-full h-14 bg-[var(--highlight)] hover:opacity-90 text-white rounded-2xl font-bold text-base shadow-xl hover:shadow-[var(--highlight)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />{" "}
                      กำลังวิเคราะห์ทีม...
                    </>
                  ) : (
                    <>
                      สร้างทีม (Generate){" "}
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleConfirmTeam}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-base shadow-xl hover:shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    <CheckSquare size={20} /> ยืนยันการสร้างทีม
                  </button>
                  <button
                    onClick={handleTryAgain}
                    className="w-full h-12 bg-transparent border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-[var(--muted)] rounded-2xl font-semibold text-sm transition-all"
                  >
                    ล้างค่า & เริ่มใหม่
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* === RIGHT PANEL: TABLE & RESULTS (60%) === */}
          <div className="flex-1 bg-[var(--background)] relative flex flex-col">
            {loadingConfig ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <ElementalLoader />
                <p className="mt-4 text-[var(--muted)] font-medium animate-pulse">
                  กำลังร่ายเวทย์ค้นหา...
                </p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-full shadow-sm flex items-center justify-center mb-6">
                  <Users
                    size={40}
                    className="text-[var(--muted)]"
                  />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                  จัดปาร์ตี้ในฝันของคุณ
                </h3>
                <p className="text-[var(--muted)] max-w-sm mx-auto text-sm leading-relaxed opacity-70">
                  เริ่มโดยการเพิ่มอาชีพ (Roles) ทางด้านซ้าย <br />
                  กิลด์จะคัดเลือกนักผจญภัยที่เหมาะสมให้ทันที
                </p>
              </div>
            ) : (
              <>
                {/* Minimal Header */}
                <div ref={resultsHeaderRef} className="h-20 px-8 flex items-center justify-between sticky top-0 bg-[var(--background)]/80 backdrop-blur-md z-10 border-b border-black/5 dark:border-white/5 scroll-mt-20">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-3">
                      {generatedTeam
                        ? "ปาร์ตี้ที่แนะนำ (Recommended Party)"
                        : "นักผจญภัย (Adventurers)"}
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[var(--foreground)]">
                        {generatedTeam
                          ? generatedTeam.members.length
                          : candidates.length}
                      </span>
                    </h3>
                    {generatedTeam && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          ปรับปรุงทีมให้เหมาะสมกับ {requirements.length}{" "}
                          ตำแหน่งแล้ว
                        </span>
                      </div>
                    )}
                  </div>

                  {!generatedTeam && (
                    <div className="flex items-center gap-2 ml-2">
                       <button
                        onClick={toggleAll}
                        className="md:hidden text-xs font-bold text-[var(--highlight)] bg-[var(--highlight)]/10 px-3 py-1.5 rounded-lg hover:bg-[var(--highlight)]/20 transition-colors"
                      >
                        {selectedPoolIds.size === candidates.filter(u => u.is_available).length && candidates.length > 0
                          ? "ยกเลิกทั้งหมด"
                          : "เลือกทั้งหมด"}
                      </button>
                      <div className="text-xs font-semibold text-[var(--muted)] flex flex-shrink-0 items-center gap-1 bg-[var(--background)] px-3 py-1.5 rounded-lg shadow-sm border border-black/5 dark:border-white/5">
                        <span className="hidden xs:inline">เลือกแล้ว</span>
                        <span className="text-[var(--highlight)]">
                          {selectedPoolIds.size}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* === Mobile List View (Cards) - Visible < md === */}
                <div className="block md:hidden p-4 space-y-3 pb-20">
                  {(generatedTeam ? generatedTeam.members : candidates).map(
                    (user: any) => {
                      const isSelected = selectedPoolIds.has(user.id);
                      const matchedDepts = getUserDepartments(user);

                      return (
                        <div
                          key={user.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
                              : "bg-transparent border-black/5 dark:border-white/5"
                          } ${
                            !user.is_available
                              ? "opacity-60 grayscale-[0.5]"
                              : ""
                          }`}
                          onClick={() => !generatedTeam && toggleUser(user.id)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                                CLASS_COLORS[user.character_class] ||
                                "text-slate-400"
                              } bg-slate-50 dark:bg-slate-800`}
                            >
                              {CLASS_ICONS[user.character_class] || (
                                <Users size={18} />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4
                                  className={`font-bold text-sm ${
                                    isSelected
                                      ? "text-[var(--highlight)]"
                                      : "text-[var(--foreground)]"
                                  }`}
                                >
                                  {user.name}
                                </h4>
                                {/* Selection Checkbox (Mobile) */}
                                {!generatedTeam && (
                                  <div
                                    className={`transition ${
                                      isSelected
                                        ? "text-[var(--highlight)] scale-110"
                                        : "text-[var(--muted)]"
                                    }`}
                                  >
                                    {isSelected ? (
                                      <CheckSquare size={20} />
                                    ) : (
                                      <Square size={20} />
                                    )}
                                  </div>
                                )}
                              </div>

                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                Lv.{user.level} • {user.character_class}
                              </p>

                              {/* Mobile OCEAN Scores */}
                              <div className="flex items-center gap-1 mt-2">
                                {["O", "C", "E", "A", "N"].map((trait) => {
                                  const val = generatedTeam
                                    ? user.ocean_scores?.[trait]
                                    : user[
                                        `ocean_${
                                          {
                                            O: "openness",
                                            C: "conscientiousness",
                                            E: "extraversion",
                                            A: "agreeableness",
                                            N: "neuroticism",
                                          }[trait] as string
                                        }`
                                      ] || 0;
                                  
                                  const intensity = val >= 70 ? "high" : val >= 40 ? "mid" : "low";
                                  
                                  return (
                                    <div key={trait} className="relative group/mobile-ocean">
                                      <div className={`w-3.5 h-3.5 rounded-[3px] text-[7px] font-black flex items-center justify-center border ${
                                         intensity === "high"
                                         ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800"
                                         : intensity === "mid"
                                         ? "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700"
                                         : "bg-transparent text-slate-300 border-transparent dark:text-slate-600"
                                      }`}>
                                        {trait}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {matchedDepts.map((d) => (
                                  <span
                                    key={d.id}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                  >
                                    {d.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="flex-1 md:overflow-y-auto p-4 md:p-8 pt-4">
                  {/* Team Score & Visualizer */}
                  <div className="hidden md:block overflow-hidden rounded-xl border border-black/5 dark:border-white/5">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-black/5 dark:bg-white/5 text-[11px] uppercase tracking-wider font-bold text-[var(--muted)] sticky top-0 backdrop-blur-md z-10">
                        <tr>
                          {!generatedTeam && (
                            <th className="px-6 py-4 w-16 text-center border-b border-black/5 dark:border-white/5">
                              <button
                                onClick={toggleAll}
                                className="hover:text-[var(--highlight)] transition-colors"
                              >
                                {selectedPoolIds.size ===
                                  candidates.filter((u) => u.is_available)
                                    .length && selectedPoolIds.size > 0 ? (
                                  <CheckSquare size={16} />
                                ) : (
                                  <Square size={16} />
                                )}
                              </button>
                            </th>
                          )}
                          <th className="px-6 py-4 border-b border-black/5 dark:border-white/5 text-[var(--foreground)]">
                            นักผจญภัย
                          </th>
                          <th className="px-6 py-4 border-b border-black/5 dark:border-white/5 text-[var(--foreground)]">
                            คลาส/อาชีพ
                          </th>
                          <th className="px-6 py-4 border-b border-black/5 dark:border-white/5 text-[var(--foreground)]">
                            สถานะ (Status)
                          </th>
                          <th className="px-6 py-4 text-center border-b border-black/5 dark:border-white/5 text-[var(--foreground)]">
                            Level
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {(generatedTeam
                          ? generatedTeam.members
                          : candidates
                        ).map((user: any, i: number) => {
                          const isSelected = selectedPoolIds.has(user.id);

                          // Identify Departments for display
                          const matchedDepts = getUserDepartments(user);

                          return (
                            <tr
                              key={user.id}
                              className={`group transition-all duration-200 ${
                                generatedTeam
                                  ? "hover:bg-black/5 dark:hover:bg-white/5"
                                  : isSelected
                                  ? "bg-black/5 dark:bg-white/5"
                                  : "hover:bg-black/5 dark:hover:bg-white/5"
                              } ${
                                !user.is_available
                                  ? "opacity-50 cursor-not-allowed grayscale"
                                  : ""
                              }`}
                              style={{ animationDelay: `${i * 50}ms` }}
                            >
                              {!generatedTeam && (
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => toggleUser(user.id)}
                                    disabled={!user.is_available}
                                    className={`transition ${
                                      isSelected
                                        ? "text-[var(--highlight)] scale-110"
                                        : "text-[var(--muted)] hover:text-[var(--highlight)]"
                                    }`}
                                  >
                                    {isSelected ? (
                                      <CheckSquare size={18} />
                                    ) : (
                                      <Square size={18} />
                                    )}
                                  </button>
                                </td>
                              )}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-[var(--background)] ${
                                      generatedTeam
                                        ? "bg-black/5 dark:bg-white/5"
                                        : "bg-black/5 dark:bg-white/5"
                                    } ${
                                      CLASS_COLORS[user.character_class] ||
                                      "text-[var(--muted)]"
                                    }`}
                                  >
                                    {CLASS_ICONS[user.character_class] || (
                                      <Users size={16} />
                                    )}
                                  </div>
                                  <div>
                                    <p
                                      className={`text-sm font-semibold ${
                                        generatedTeam
                                          ? "text-[var(--foreground)]"
                                          : "text-[var(--foreground)]"
                                      } `}
                                    >
                                      {user.name}
                                    </p>
                                    {/* Minimalist OCEAN Display */}
                                    <div className="flex items-center gap-1.5 mt-1">
                                      {["O", "C", "E", "A", "N"].map(
                                        (trait) => {
                                          const val = generatedTeam
                                            ? user.ocean_scores?.[trait]
                                            : user[
                                                `ocean_${
                                                  {
                                                    O: "openness",
                                                    C: "conscientiousness",
                                                    E: "extraversion",
                                                    A: "agreeableness",
                                                    N: "neuroticism",
                                                  }[trait] as string
                                                }`
                                              ] || 0;

                                          const intensity =
                                            val >= 70
                                              ? "high"
                                              : val >= 40
                                              ? "mid"
                                              : "low";

                                          return (
                                            <div
                                              key={trait}
                                              className="relative group/ocean cursor-help"
                                            >
                                              <div
                                                className={`w-4 h-4 rounded text-[8px] font-black flex items-center justify-center border ${
                                                  intensity === "high"
                                                    ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800"
                                                    : intensity === "mid"
                                                    ? "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700"
                                                    : "bg-transparent text-slate-300 border-transparent dark:text-slate-600"
                                                }`}
                                              >
                                                {trait}
                                              </div>
                                              {/* Tooltip */}
                                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/ocean:block px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap z-50">
                                                {trait}: {val}
                                              </div>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {user.is_available ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    ว่าง
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                                    ติดภารกิจ
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-1 flex-wrap">
                                  {matchedDepts.length > 0 ? (
                                    <>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 shadow-sm whitespace-nowrap">
                                        {matchedDepts[0].label ||
                                          matchedDepts[0].name}
                                      </span>
                                      {matchedDepts.length > 1 && (
                                        <div className="group/tooltip relative">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-help">
                                            +{matchedDepts.length - 1}
                                          </span>
                                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block z-50">
                                            <div className="bg-slate-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                                              {matchedDepts
                                                .slice(1)
                                                .map((d) => d.label || d.name)
                                                .join(", ")}
                                              <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-slate-800"></div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-mono text-xs text-slate-400">
                                  LVL.{user.level}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* AI Team Analysis Section */}
                  {generatedTeam && (
                    <div className="mt-6 p-4 rounded-2xl bg-[var(--highlight)]/5 border border-[var(--highlight)]/10 animate-in fade-in zoom-in duration-500">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--highlight)] mb-2 flex items-center gap-2">
                        <Sparkles size={14} /> AI Team Analysis
                      </h4>
                      {isAnalyzingText ? (
                        <div className="flex items-center gap-2 text-sm text-[var(--muted)] animate-pulse">
                          <Loader2 size={14} className="animate-spin" />{" "}
                          กำลังประมวลผลบุคลิกภาพทีม...
                         </div>
                      ) : teamAnalysisText ? (
                        <p className="text-sm text-[var(--foreground)] leading-relaxed font-medium opacity-90">
                          {teamAnalysisText}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--muted)] italic">
                          ไม่สามารถดึงข้อมูลวิเคราะห์ได้
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Results Footer (Floating) if generated - Hidden on Mobile */}
            {generatedTeam && (
              <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 backdrop-blur-xl bg-[var(--background)]/80 p-1.5 rounded-full shadow-2xl border border-black/5 dark:border-white/5 items-center gap-4 pr-6 animate-in slide-in-from-bottom-6 zoom-in-95 duration-500">
                <div className="w-12 h-12 rounded-full bg-[var(--foreground)] flex items-center justify-center">
                  <span className="text-[var(--background)] font-black text-sm">
                    {generatedTeam.harmony_score}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)]">
                    คะแนนความเข้ากันได้
                  </span>
                  {/* Dynamic Label Logic */}
                  {(() => {
                    const score = generatedTeam.harmony_score || 0;
                    let label = "เข้ากันได้ปานกลาง";
                    let colorClass = "text-yellow-600 dark:text-yellow-400";

                    if (score >= 80) {
                      label = "เข้ากันได้ดีเยี่ยม";
                      colorClass = "text-green-600 dark:text-green-400";
                    } else if (score >= 60) {
                      label = "เข้ากันได้ดี";
                      colorClass = "text-[var(--highlight)]";
                    } else if (score < 40) {
                      label = "ความเข้ากันได้ต่ำ";
                      colorClass = "text-red-500 dark:text-red-400";
                    }

                    return (
                      <span className={`text-sm font-bold ${colorClass}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
                <div className="h-8 w-[1px] bg-black/10 dark:bg-white/10 mx-2" />
                <button
                  onClick={handleConfirmTeam}
                  className="text-sm font-bold text-[var(--highlight)] hover:opacity-80 flex items-center gap-1"
                >
                  ยืนยัน <ArrowRight size={14} />
                </button>
              </div>
            )}
        {/* === Mobile Sticky Bottom Bar (Moved inside Right Panel) === */}
        <div className="md:hidden mt-auto sticky bottom-0 left-0 right-0 p-4 bg-[var(--background)]/80 backdrop-blur-xl border-t border-black/5 dark:border-white/5 z-40 flex gap-3 safe-area-bottom pb-6 transition-all">
          {!generatedTeam ? (
            <button
              onClick={handleGenerate}
              disabled={analyzing}
              className="w-full h-12 bg-[var(--highlight)] text-white rounded-xl font-bold shadow-lg shadow-[var(--highlight)]/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> วิเคราะห์...
                </>
              ) : (
                <>
                  สร้างทีม (Generate) <ArrowRight size={18} />
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleTryAgain}
                className="flex-1 h-12 bg-black/5 dark:bg-white/5 text-[var(--foreground)] rounded-xl font-bold active:scale-95 transition-all border border-black/5 dark:border-white/5"
              >
                เริ่มใหม่
              </button>
              <button
                onClick={handleConfirmTeam}
                className="flex-[2] h-12 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckSquare size={18} /> ยืนยัน ({Math.round(generatedTeam.harmony_score)}%)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
      </div>
    </ProtectedRoute>
  );
}
