"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Plus,
  Minus,
  Briefcase,
  Users,
  CheckCircle,
  AlertCircle,
  Zap,
  Shield,
  Heart,
  Loader2,
  Calendar,
  Sparkles,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Departments List (Matching Backend IDs)
const DEPARTMENTS = [
  { id: "swp_od", name: "SWP & Organization Development" },
  { id: "hrbp", name: "HR Business Partner (HRBP)" },
  { id: "total_rewards", name: "Total Rewards (Comp & Ben)" },
  { id: "er", name: "Employee Relations (ER)" },
  { id: "engagement", name: "Employee Engagement & Internal Comm" },
  { id: "talent_mgmt", name: "Talent Management" },
  { id: "people_services", name: "People Services (HR Ops)" },
  { id: "compliance", name: "HR Compliance & Assurance" },
  { id: "l_and_d", name: "Learning & Development (L&D)" },
  { id: "hr_ai", name: "HR AI & Automation" },
  { id: "success_factors", name: "HR SuccessFactors Specialist" },
  { id: "hr_dashboards", name: "HR Dashboards & Analytics" },
  { id: "project_manager", name: "Project Manager" },
];

export default function SmartQuestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Input, 2: Preview
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});

  // Available Users Data
  const [availableMap, setAvailableMap] = useState<Record<string, number>>({});
  const [fetchingUsers, setFetchingUsers] = useState(true);

  // Preview State
  const [previewData, setPreviewData] = useState<any>(null);

  const totalMembers = Object.values(deptCounts).reduce((a, b) => a + b, 0);

  // Fetch available users on mount
  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await axios.get(`${API_URL}/users/roster`);
        // Map users to departments skills logic is handled in backend logic usually,
        // but here we just need to count available users per department.
        // Since get_user_roster returns users, and users have 'skills' (which are now Departments),
        // we can count them.

        // Note: The roster endpoint returns user details. Ideally, we inspect their 'skills' JSON to find Dept ID.
        // Wait, 'skills' field in User model stores the JSON. Roster usually returns flattened or processed status.
        // Let's check `get_user_roster` response structure again from previous logs...
        // It returns 'scores', 'is_available'. It DOES NOT seem to return 'skills' directly in the roster view snippet I saw earlier.
        // I should fetch '/users' instead to get the full skill list (which contains dept name) to count correctly.

        const fullRes = await axios.get(`${API_URL}/users`);
        const users = fullRes.data;

        const counts: Record<string, number> = {};

        users.forEach((u: any) => {
          if (u.is_available) {
            // Check user's departments (stored in skills)
            if (u.skills && Array.isArray(u.skills)) {
              u.skills.forEach((s: any) => {
                // Find dept ID by matching name
                const dept = DEPARTMENTS.find((d) => d.name === s.name);
                if (dept) {
                  counts[dept.id] = (counts[dept.id] || 0) + 1;
                }
              });
            }
          }
        });
        setAvailableMap(counts);
      } catch (err) {
        console.error("Failed to fetch user availability", err);
      } finally {
        setFetchingUsers(false);
      }
    }
    fetchAvailability();
  }, []);

  const handleRequirementChange = (deptId: string, delta: number) => {
    const maxAvailable = availableMap[deptId] || 0;

    setDeptCounts((prev) => {
      const current = prev[deptId] || 0;
      const next = Math.max(0, current + delta);

      // Limit to max available (Optional constraint, but user asked "closed/grayed out if no one", implies limit)
      if (next > maxAvailable) {
        toast.error(`แผนกนี้มีคนว่างแค่ ${maxAvailable} คนครับ`);
        return prev;
      }

      if (next === 0) {
        const { [deptId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [deptId]: next };
    });
  };

  const handlePreview = async () => {
    if (!title || !deadline || totalMembers === 0) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setLoading(true);
      const requirements = Object.entries(deptCounts).map(
        ([deptId, count]) => ({
          department_id: deptId,
          count,
        })
      );

      const res = await axios.post(`${API_URL}/quests/smart/preview`, {
        requirements,
      });
      setPreviewData(res.data);
      setStep(2);
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการสร้างทีม");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const requirements = Object.entries(deptCounts).map(
        ([deptId, count]) => ({
          department_id: deptId,
          count,
        })
      );

      const member_ids = previewData.members.map((m: any) => m.id);

      const res = await axios.post(`${API_URL}/quests/smart/confirm`, {
        title,
        deadline: new Date(deadline).toISOString(),
        start_date: new Date().toISOString(),
        leader_id: 1, // Placeholder
        requirements,
        member_ids,
        status: "filled",
      });

      toast.success("สร้างทีมสำเร็จ!");
      router.push("/quests");
    } catch (error) {
      console.error(error);
      toast.error("ยืนยันทีมล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  // Helper for colors
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-rose-500";
    if (score >= 60) return "text-orange-500";
    return "text-slate-400";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 transition-colors">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowRight className="rotate-180" />
            </button>
            <h1 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="text-yellow-500" />
              Quest 2: Smart Team Builder
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                <Briefcase className="text-blue-500" />
                ข้อมูลพื้นฐาน
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    ชื่อ Quest
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น ออกแบบระบบ HR Dashboard ใหม่"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    กำหนดส่ง (Deadline)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                <Users className="text-emerald-500" />
                โครงสร้างทีม (เลือกจำนวนคนที่ต้องการ)
              </h2>

              {fetchingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {DEPARTMENTS.map((dept) => {
                    const count = deptCounts[dept.id] || 0;
                    const available = availableMap[dept.id] || 0;
                    const isFullyBooked = count >= available;
                    const isDisabled = available === 0;

                    return (
                      <div
                        key={dept.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isDisabled
                            ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60"
                            : "bg-slate-50 dark:bg-slate-700/30 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {isDisabled && (
                            <Lock
                              size={16}
                              className="text-slate-400 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isDisabled
                                  ? "text-slate-500 dark:text-slate-500"
                                  : "text-slate-700 dark:text-slate-200"
                              }`}
                            >
                              {dept.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              ว่าง {available} คน
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleRequirementChange(dept.id, -1)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                              count > 0
                                ? "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                                : "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                            }`}
                            disabled={count === 0}
                          >
                            <Minus size={14} />
                          </button>
                          <span
                            className={`w-6 text-center font-bold ${
                              count > 0
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-400 dark:text-slate-600"
                            }`}
                          >
                            {count}
                          </span>
                          <button
                            onClick={() => handleRequirementChange(dept.id, 1)}
                            disabled={isDisabled || isFullyBooked}
                            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                              isDisabled || isFullyBooked
                                ? "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed bg-slate-50 dark:bg-slate-900"
                                : "border-slate-300 dark:border-slate-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700"
                            }`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {totalMembers > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-between border border-blue-100 dark:border-blue-800 transition-colors">
                  <span className="text-blue-800 dark:text-blue-200 font-medium">
                    สมาชิกทั้งหมด
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalMembers} คน
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handlePreview}
              disabled={loading || totalMembers === 0 || !title || !deadline}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              วิเคราะห์และจัดทีมด้วย AI
            </button>
          </div>
        )}

        {step === 2 && previewData && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Harmony Score Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
              <h2 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">
                Golden Formula Score
              </h2>
              <div className="flex items-center justify-center gap-3 mb-2">
                <Heart
                  className={`w-8 h-8 ${getScoreColor(
                    previewData.harmony_score
                  )} fill-current`}
                />
                <span
                  className={`text-5xl font-black ${getScoreColor(
                    previewData.harmony_score
                  )}`}
                >
                  {previewData.harmony_score}%
                </span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                Team Harmony & Compatibility
              </p>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 block">
                สมาชิกที่แนะนำ ({previewData.members.length} คน)
              </h3>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-bold">
                Available Only
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {previewData.members.map((member: any) => (
                <div
                  key={member.id}
                  className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors hover:border-blue-300 dark:hover:border-blue-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl border border-slate-200 dark:border-slate-600">
                      {/* Simple Avatar */}
                      {member.character_class === "Mage"
                        ? "🧙‍♂️"
                        : member.character_class === "Warrior"
                        ? "⚔️"
                        : member.character_class === "Paladin"
                        ? "🛡️"
                        : member.character_class === "Cleric"
                        ? "❤️"
                        : "🗡️"}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">
                        {member.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md font-medium">
                          {member.dept_name}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Lv.{member.level}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      OCEAN
                    </div>
                    <div className="flex gap-1">
                      {["O", "C", "E", "A", "N"].map((k) => (
                        <div
                          key={k}
                          className="w-1 h-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative"
                          title={`${k}: ${member.ocean_scores[k]}`}
                        >
                          <div
                            className="absolute bottom-0 w-full bg-slate-400 dark:bg-slate-500"
                            style={{
                              height: `${(member.ocean_scores[k] / 50) * 100}%`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                แก้ไขเงื่อนไข
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-[2] py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CheckCircle />
                )}
                ยืนยันทีมนี้ (Create & Lock)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
