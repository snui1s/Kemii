"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  Search,
  ChevronRight,
  Star,
  Check,
  X,
  ArrowRight,
  SkipForward,
} from "lucide-react";
import toast from "react-hot-toast";

interface Department {
  id: string;
  name: string;
  skills: string[];
}

interface SelectedSkill {
  name: string;
  level: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const LEVEL_LABELS = [
  { level: 1, label: "เริ่มต้น", color: "bg-slate-400" },
  { level: 2, label: "พื้นฐาน", color: "bg-blue-400" },
  { level: 3, label: "ปานกลาง", color: "bg-green-400" },
  { level: 4, label: "ก้าวหน้า", color: "bg-amber-400" },
  { level: 5, label: "เชี่ยวชาญ", color: "bg-purple-500" },
];

export default function SkillsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch skills data
  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await axios.get(`${API_URL}/skills`);
        setDepartments(res.data.departments);
        if (res.data.departments.length > 0) {
          setSelectedDept(res.data.departments[0].id);
        }
      } catch (err) {
        toast.error("ไม่สามารถโหลดข้อมูล Skills ได้");
      } finally {
        setLoading(false);
      }
    }
    fetchSkills();
  }, []);

  // Filter skills by search
  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show skills from selected department
      const dept = departments.find((d) => d.id === selectedDept);
      return dept?.skills || [];
    }
    // Search across all departments
    const query = searchQuery.toLowerCase();
    const results: { skill: string; dept: string }[] = [];
    departments.forEach((dept) => {
      dept.skills.forEach((skill) => {
        if (skill.toLowerCase().includes(query)) {
          results.push({ skill, dept: dept.name });
        }
      });
    });
    return results;
  }, [departments, selectedDept, searchQuery]);

  const toggleSkill = (skillName: string) => {
    const existing = selectedSkills.find((s) => s.name === skillName);
    if (existing) {
      setSelectedSkills(selectedSkills.filter((s) => s.name !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, { name: skillName, level: 3 }]);
    }
  };

  const updateLevel = (skillName: string, level: number) => {
    setSelectedSkills(
      selectedSkills.map((s) => (s.name === skillName ? { ...s, level } : s))
    );
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error("ไม่พบ User ID");
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API_URL}/users/${userId}/skills`, {
        skills: selectedSkills,
      });
      toast.success("บันทึก Skills สำเร็จ!");
      router.push("/");
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/20 p-4 md:p-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-2">
            เลือก Skills ของคุณ
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            เลือกทักษะที่คุณถนัด และระบุระดับความเชี่ยวชาญ (1-5)
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4 md:mb-6">
          <Search
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="ค้นหา Skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm md:text-base text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Department List */}
          {!searchQuery && (
            <div className="lg:col-span-4 bg-white dark:bg-slate-800/50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200 dark:border-slate-700 max-h-[300px] md:max-h-[500px] overflow-y-auto shadow-sm dark:shadow-none">
              <h3 className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 md:mb-3">
                แผนก
              </h3>
              <div className="space-y-1.5 md:space-y-2">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl transition-all flex items-center justify-between group ${
                      selectedDept === dept.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="text-xs md:text-sm font-medium truncate pr-2">
                      {dept.name}
                    </span>
                    <ChevronRight
                      size={14}
                      className={`shrink-0 ${
                        selectedDept === dept.id
                          ? "text-white"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Skills Grid */}
          <div
            className={`${
              searchQuery ? "lg:col-span-12" : "lg:col-span-8"
            } bg-white dark:bg-slate-800/50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none`}
          >
            <h3 className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 md:mb-3">
              {searchQuery
                ? `ผลการค้นหา (${filteredSkills.length})`
                : "เลือก Skills"}
            </h3>
            <div className="flex flex-wrap gap-1.5 md:gap-2 max-h-[250px] md:max-h-[400px] overflow-y-auto">
              {Array.isArray(filteredSkills) &&
                filteredSkills.map((item, idx) => {
                  const skillName =
                    typeof item === "string" ? item : item.skill;
                  const isSelected = selectedSkills.some(
                    (s) => s.name === skillName
                  );
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleSkill(skillName)}
                      className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all border ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-500"
                      }`}
                    >
                      {isSelected && (
                        <Check className="inline mr-0.5 md:mr-1" size={12} />
                      )}
                      {skillName}
                    </button>
                  );
                })}
              {filteredSkills.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm">
                  ไม่พบ Skill ที่ค้นหา
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Selected Skills with Level */}
        {selectedSkills.length > 0 && (
          <div className="mt-4 md:mt-6 bg-white dark:bg-slate-800/50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
            <h3 className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 md:mb-4">
              Skills ที่เลือก ({selectedSkills.length})
            </h3>
            <div className="space-y-2 md:space-y-3">
              {selectedSkills.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center gap-2 md:gap-4 bg-slate-100 dark:bg-slate-700/50 p-2 md:p-3 rounded-lg md:rounded-xl"
                >
                  <button
                    onClick={() => toggleSkill(skill.name)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
                  >
                    <X size={14} />
                  </button>
                  <span className="flex-1 text-slate-800 dark:text-white text-xs md:text-sm font-medium truncate">
                    {skill.name}
                  </span>
                  <div className="flex gap-0.5 md:gap-1 shrink-0">
                    {LEVEL_LABELS.map((l) => (
                      <button
                        key={l.level}
                        onClick={() => updateLevel(skill.name, l.level)}
                        className={`w-6 h-6 md:w-8 md:h-8 rounded md:rounded-lg flex items-center justify-center text-[10px] md:text-xs font-bold transition-all ${
                          skill.level >= l.level
                            ? `${l.color} text-white`
                            : "bg-slate-200 dark:bg-slate-600 text-slate-400"
                        }`}
                        title={l.label}
                      >
                        {l.level}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <button
            onClick={handleSkip}
            className="px-4 md:px-6 py-2.5 md:py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all flex items-center justify-center gap-2"
          >
            <SkipForward size={16} />
            ข้ามไปก่อน
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedSkills.length === 0}
            className="px-6 md:px-8 py-2.5 md:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {saving ? (
              "กำลังบันทึก..."
            ) : (
              <>
                บันทึก
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
