"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Plus,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequirementRow {
  id: string; // unique id for row key
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
  id: number;
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

  // --- State: Data ---
  // --- State: Data ---
  // Using useQuery for consistent caching
  const { data: allUsers = [], isLoading: loadingConfig } = useQuery<
    SmartQuestUser[]
  >({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/users`);
      return res.data;
    },
  });

  const [analyzing, setAnalyzing] = useState(false);

  // --- State: Left Panel (Inputs) ---
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  // Start with one empty row
  const [requirements, setRequirements] = useState<RequirementRow[]>([
    { id: "1", deptId: "", count: 1 },
  ]);

  // --- State: Right Panel (Selection) ---
  const [selectedPoolIds, setSelectedPoolIds] = useState<Set<number>>(
    new Set()
  );
  const [generatedTeam, setGeneratedTeam] = useState<GeneratedTeam | null>(
    null
  ); // For results
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [teamAnalysisText, setTeamAnalysisText] = useState<string | null>(null);

  // --- Derived State: Candidates based on Dept Selection ---
  const candidates = useMemo(() => {
    // 1. Collect all target department IDs
    const targetDeptIds = new Set(
      requirements.filter((r) => r.deptId).map((r) => r.deptId)
    );

    if (targetDeptIds.size === 0) return [];

    // 2. Filter users who match ANY of these departments
    return allUsers
      .filter((user) => {
        // Parse skills if string
        const skills =
          typeof user.skills === "string"
            ? JSON.parse(user.skills)
            : user.skills || [];

        // Check if user belongs to any selected department
        return Array.from(targetDeptIds).some((deptId) => {
          const deptDef = DEPARTMENTS.find((d) => d.id === deptId);
          if (!deptDef) return false;
          return skills.some((s: any) => matchesDepartment(s.name, deptDef));
        });
      })
      .sort((a, b) => {
        // Sort by Availability (Available first)
        if (a.is_available === b.is_available) return 0;
        return a.is_available ? -1 : 1;
      });
  }, [allUsers, requirements]);

  // --- Auto-select new candidates when they appear in the list ---
  useEffect(() => {
    setSelectedPoolIds((prev) => {
      const next = new Set(prev);
      candidates.forEach((c) => {
        if (c.is_available) next.add(c.id);
      });
      return next;
    });
  }, [candidates.length]);

  // --- Derived State: Availability Count per Department ---
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

  // --- Handlers: Left Panel ---
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

  // --- Handlers: Right Panel ---
  const toggleUser = (userId: number) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user && !user.is_available) {
      toast.error("พนักงานคนนี้ติดภารกิจอยู่ ไม่สามารถเลือกได้");
      return;
    }

    const next = new Set(selectedPoolIds);
    if (next.has(userId)) {
      // Check minimum requirement constraint
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
      setSelectedPoolIds(new Set()); // Uncheck all
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

    // Find ALL matching departments
    return DEPARTMENTS.filter((d) =>
      skills.some((s: any) => matchesDepartment(s.name, d))
    );
  };

  // --- Verify & Generate ---
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

      const res = await axios.post(`${API_URL}/teams/preview`, payload);

      if (!res.data.members || res.data.members.length === 0) {
        toast.error("ไม่สามารถจัดทีมได้ตามเงื่อนไข (ลองเปลี่ยนคนหรือลดสเปคลง)");
        setGeneratedTeam(null);
        return;
      }

      setGeneratedTeam(res.data);

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

      axios
        .post(`${API_URL}/teams/analyze`, {
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
        leader_id: currentUser?.id || 1, // Fallback
        requirements: requirements
          .filter((r) => r.deptId)
          .map((r) => ({ department_id: r.deptId, count: r.count })),
        member_ids: generatedTeam.members.map((m: any) => m.id),
        status: "filled",
      };
      await axios.post(`${API_URL}/teams/confirm`, payload);
      toast.success("สร้างทีมสำเร็จ!");
      router.push("/quests");
    } catch (err) {
      toast.error("ยืนยันทีมล้มเหลว");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 flex flex-col font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {/* === LEFT PANEL: INPUTS (40%) === */}
        <div className="w-full md:w-[400px] lg:w-[450px] p-8 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 overflow-y-auto z-20 shadow-xl md:shadow-none flex flex-col">
          <div className="flex-1 space-y-10">
            {/* Header */}
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none mb-4">
                <Sparkles className="text-white" size={20} strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                ระบบจัดปาร์ตี้
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                ระบุรายละเอียดโปรเจกต์และโครงสร้างทีม <br />
                AI
                ของเราจะคัดเลือกคนที่เหมาะสมที่สุดทั้งความสามารถและความเข้ากันได้
              </p>
            </div>

            {/* Project Info */}
            <div className="space-y-5 animate-in slide-in-from-left-2 duration-500 delay-100">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 flex items-center gap-2">
                <Scroll size={14} className="text-indigo-500" /> ข้อมูลภารกิจ
                (Quest Info)
              </h2>
              <div className="space-y-4">
                <div className="group relative">
                  <input
                    type="text"
                    placeholder="ชื่อภารกิจ"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="peer w-full px-0 py-2 bg-transparent border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium text-lg"
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all peer-focus:w-full" />
                </div>

                <div className="group relative pt-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 group-focus-within:text-indigo-500 transition-colors mb-1 block">
                    รายละเอียด (Description)
                  </label>
                  <textarea
                    placeholder="ระบุขอบเขตงาน, เป้าหมาย หรือสิ่งที่ต้องทำ..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="peer w-full px-0 py-2 bg-transparent border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 text-sm resize-none h-20"
                  />
                  <div className="absolute bottom-1.5 left-0 w-0 h-0.5 bg-indigo-500 transition-all peer-focus:w-full" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 group">
                    <label className="text-[10px] uppercase font-bold text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      วันเริ่ม
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full py-2 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none transition text-sm font-medium text-slate-700 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 group">
                    <label className="text-[10px] uppercase font-bold text-slate-400 group-focus-within:text-pink-500 transition-colors">
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
                        className="w-full py-2 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-pink-500 outline-none transition text-sm font-medium text-slate-700 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Requirements */}
            <div className="space-y-5 animate-in slide-in-from-left-2 duration-500 delay-200">
              <div className="flex justify-between items-end">
                <h2 className="text-xs uppercase tracking-widest font-semibold text-slate-400 flex items-center gap-2">
                  <Users size={14} className="text-indigo-500" /> จัดปาร์ตี้
                  (Party Setup)
                </h2>
                <button
                  onClick={addRow}
                  className="text-[10px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-full px-3 py-1 transition flex items-center gap-1"
                >
                  <Plus size={12} strokeWidth={3} /> เพิ่มตำแหน่ง
                </button>
              </div>

              <div className="space-y-3">
                {requirements.map((row, idx) => {
                  // Get available users for this specific row's department using the pre-calculated map
                  const availableCount = row.deptId
                    ? deptAvailabilityMap[row.deptId] || 0
                    : 0;

                  // Filter out departments already selected in other rows
                  const availableOptions = DEPARTMENTS.filter((d) => {
                    const isSelectedInOtherRow = requirements.some(
                      (r) => r.id !== row.id && r.deptId === d.id
                    );
                    return !isSelectedInOtherRow;
                  });

                  return (
                    <div
                      key={row.id}
                      className="group flex gap-3 items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <Select
                          value={row.deptId || ""}
                          onValueChange={(val) =>
                            updateRow(row.id, "deptId", val)
                          }
                        >
                          <SelectTrigger className="w-full bg-transparent border-none p-0 h-auto text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 shadow-none">
                            <SelectValue placeholder="เลือกแผนก (Department)" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableOptions.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.label || d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {row.deptId && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            ว่างตอนนี้:{" "}
                            <span className="font-bold text-emerald-500">
                              {availableCount}
                            </span>{" "}
                            คน
                          </p>
                        )}
                      </div>

                      <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">
                          จำนวน
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={row.deptId ? availableCount : undefined}
                          value={row.count}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 1;
                            if (row.deptId && val > availableCount)
                              val = availableCount; // Clamp
                            updateRow(row.id, "count", val);
                          }}
                          className="w-12 bg-transparent text-sm font-bold text-center text-slate-900 dark:text-white outline-none focus:text-indigo-600 transition-colors"
                        />
                      </div>

                      {requirements.length > 1 && (
                        <button
                          onClick={() => removeRow(row.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all ml-1"
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

          {/* Action Area (Sticky Bottom on Desktop) */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            {!generatedTeam ? (
              <button
                onClick={handleGenerate}
                disabled={analyzing}
                className="w-full h-14 bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full h-12 bg-white border border-slate-200 hover:border-slate-300 dark:bg-transparent dark:border-slate-700 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 rounded-2xl font-semibold text-sm transition-all"
                >
                  ล้างค่า & เริ่มใหม่
                </button>
              </div>
            )}
          </div>
        </div>

        {/* === RIGHT PANEL: TABLE & RESULTS (60%) === */}
        <div className="flex-1 bg-slate-50/50 dark:bg-slate-950/20 relative flex flex-col">
          {loadingConfig ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="flex items-center gap-3 text-indigo-600 font-medium animate-pulse">
                <Loader2 className="animate-spin" /> กำลังร่ายเวทย์ค้นหา...
              </div>
            </div>
          ) : candidates.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full shadow-sm flex items-center justify-center mb-6">
                <Users
                  size={40}
                  className="text-slate-200 dark:text-slate-700"
                />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
                จัดปาร์ตี้ในฝันของคุณ
              </h3>
              <p className="text-slate-400 max-w-sm mx-auto text-sm leading-relaxed">
                เริ่มโดยการเพิ่มอาชีพ (Roles) ทางด้านซ้าย <br />
                กิลด์จะคัดเลือกนักผจญภัยที่เหมาะสมให้ทันที
              </p>
            </div>
          ) : (
            <>
              {/* Minimal Header */}
              <div className="h-20 px-8 flex items-center justify-between sticky top-0 bg-slate-50/20 dark:bg-slate-900/20 backdrop-blur-md z-10 border-b border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    {generatedTeam
                      ? "ปาร์ตี้ที่แนะนำ (Recommended Party)"
                      : "นักผจญภัย (Adventurers)"}
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
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
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                    เลือกแล้ว
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {selectedPoolIds.size}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-4">
                {/* AI Team Analysis Section */}
                {generatedTeam && (
                  <div className="mb-6 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 animate-in fade-in zoom-in duration-500">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2 flex items-center gap-2">
                      <Sparkles size={14} /> AI Team Analysis
                    </h4>
                    {isAnalyzingText ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500 animate-pulse">
                        <Loader2 size={14} className="animate-spin" />{" "}
                        กำลังประมวลผลบุคลิกภาพทีม...
                      </div>
                    ) : teamAnalysisText ? (
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {teamAnalysisText}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">
                        ไม่สามารถดึงข้อมูลวิเคราะห์ได้
                      </p>
                    )}
                  </div>
                )}

                {/* Team Score & Visualizer */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8"></div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-[11px] uppercase tracking-wider font-bold text-slate-400 sticky top-0">
                      <tr>
                        {!generatedTeam && (
                          <th className="px-6 py-4 w-16 text-center border-b border-slate-100 dark:border-slate-800">
                            <button
                              onClick={toggleAll}
                              className="hover:text-indigo-500 transition-colors"
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
                        <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                          นักผจญภัย
                        </th>
                        <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                          คลาส/อาชีพ
                        </th>
                        <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                          สถานะ (Status)
                        </th>
                        <th className="px-6 py-4 text-center border-b border-slate-100 dark:border-slate-800">
                          Level
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {(generatedTeam ? generatedTeam.members : candidates).map(
                        (user: any, i: number) => {
                          const isSelected = selectedPoolIds.has(user.id);

                          // Identify Departments for display
                          const matchedDepts = getUserDepartments(user);

                          return (
                            <tr
                              key={user.id}
                              className={`group transition-all duration-200 ${
                                generatedTeam
                                  ? "hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10"
                                  : isSelected
                                  ? "bg-slate-50/30 dark:bg-slate-800/30"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/20"
                              } ${
                                !user.is_available
                                  ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900/50"
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
                                        ? "text-indigo-600 scale-110"
                                        : "text-slate-300 hover:text-indigo-400"
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
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-white dark:ring-slate-800 ${
                                      generatedTeam
                                        ? "bg-slate-50 dark:bg-slate-900"
                                        : "bg-white dark:bg-slate-800"
                                    } ${
                                      CLASS_COLORS[user.character_class] ||
                                      "text-slate-400"
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
                                          ? "text-indigo-900 dark:text-indigo-100"
                                          : "text-slate-700 dark:text-slate-200"
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
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Results Footer (Floating) if generated */}
          {generatedTeam && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-full shadow-2xl border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-4 pr-6 animate-in slide-in-from-bottom-6 zoom-in-95 duration-500">
              <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center">
                <span className="text-white dark:text-slate-900 font-black text-sm">
                  {generatedTeam.harmony_score}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">
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
                    colorClass = "text-indigo-600 dark:text-indigo-400";
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
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
              <button
                onClick={handleConfirmTeam}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                ยืนยัน <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
