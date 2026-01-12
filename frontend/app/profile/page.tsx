"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import ElementalLoader from "@/components/ElementalLoader";
import {
  User as UserIcon,
  Shield,
  Sword,
  Wand,
  Heart,
  Skull,
  Edit3,
  Save,
  X,
  Search,
  ChevronLeft,
  Star,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Trophy,
  Users,
  Award,
  Flame,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface UserData {
  id: string;
  name: string;
  character_class: string;
  level: number;
  ocean_openness: number;
  ocean_conscientiousness: number;
  ocean_extraversion: number;
  ocean_agreeableness: number;
  ocean_neuroticism: number;
  skills?: string;
  analysis_result?: string;
}

import { DEPARTMENTS, matchesDepartment } from "@/data/departments";

interface SelectedSkill {
  name: string;
  level: number;
}

const CLASS_ICONS: Record<string, React.ReactNode> = {
  Mage: <Wand size={28} />,
  Paladin: <Shield size={28} />,
  Warrior: <Sword size={28} />,
  Cleric: <Heart size={28} />,
  Rogue: <Skull size={28} />,
};

const CLASS_COLORS: Record<string, string> = {
  Mage: "from-purple-500 to-indigo-600",
  Paladin: "from-yellow-500 to-amber-600",
  Warrior: "from-red-500 to-rose-600",
  Cleric: "from-green-500 to-emerald-600",
  Rogue: "from-blue-900 to-indigo-900",
};

const CLASS_STAT_COLORS: Record<string, string> = {
  Mage: "#a855f7",
  Paladin: "#eab308",
  Warrior: "#ef4444",
  Cleric: "#22c55e",
  Rogue: "#3b82f6",
};

const CLASS_INFO: Record<
  string,
  {
    title: string;
    desc: string;
    strengths: string[];
    bestWith: string[];
    emoji: string;
  }
> = {
  Mage: {
    title: "นักเวทย์",
    desc: "ผู้เชี่ยวชาญด้านความคิดสร้างสรรค์และนวัตกรรม ชอบสำรวจแนวคิดใหม่ๆ",
    strengths: ["ความคิดสร้างสรรค์", "มองการณ์ไกล", "นอกกรอบ"],
    bestWith: ["Paladin", "Cleric"],
    emoji: "🔮",
  },
  Paladin: {
    title: "อัศวิน",
    desc: "ผู้นำที่มีวินัยและความรับผิดชอบสูง วางแผนรอบคอบ ทำงานเป็นระบบ",
    strengths: ["มีวินัย", "เป็นผู้นำ", "รอบคอบ"],
    bestWith: ["Mage", "Warrior"],
    emoji: "⚔️",
  },
  Warrior: {
    title: "นักรบ",
    desc: "ผู้ที่ชอบลงมือทำ กระตือรือร้น มีพลังในการขับเคลื่อนทีม",
    strengths: ["กระตือรือร้น", "ลงมือทำ", "เต็มไปด้วยพลัง"],
    bestWith: ["Paladin", "Rogue"],
    emoji: "🗡️",
  },
  Cleric: {
    title: "นักบวช",
    desc: "ผู้ที่เห็นอกเห็นใจ เข้ากับคนง่าย ช่วยเหลือและสนับสนุนทีม",
    strengths: ["เห็นใจผู้อื่น", "ประสานงาน", "สร้างความสามัคคี"],
    bestWith: ["Mage", "Rogue"],
    emoji: "💚",
  },
  Rogue: {
    title: "โจร",
    desc: "ผู้ที่มีความละเอียดอ่อน รอบคอบ วิเคราะห์สถานการณ์ได้ดี",
    strengths: ["ละเอียดรอบคอบ", "วิเคราะห์เก่ง", "ระมัดระวัง"],
    bestWith: ["Warrior", "Cleric"],
    emoji: "🗡️",
  },
};

const OCEAN_LABELS = [
  { key: "O", name: "Openness", desc: "เปิดรับประสบการณ์", icon: Sparkles },
  { key: "C", name: "Conscientiousness", desc: "มีระเบียบวินัย", icon: Target },
  { key: "E", name: "Extraversion", desc: "ชอบสังคม กระตือรือร้น", icon: Zap },
  {
    key: "A",
    name: "Agreeableness",
    desc: "เห็นใจ เข้ากับคนง่าย",
    icon: Heart,
  },
  { key: "N", name: "Neuroticism", desc: "อารมณ์อ่อนไหว", icon: TrendingUp },
];

const LEVEL_LABELS = [
  { level: 1, label: "เริ่มต้น", color: "bg-slate-400" },
  { level: 2, label: "พื้นฐาน", color: "bg-blue-400" },
  { level: 3, label: "ปานกลาง", color: "bg-green-400" },
  { level: 4, label: "ก้าวหน้า", color: "bg-amber-400" },
  { level: 5, label: "เชี่ยวชาญ", color: "bg-purple-500" },
];

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, loading: authLoading } = useAuth();

  const [profileUser, setProfileUser] = useState<UserData | null>(null);
  const [skills, setSkills] = useState<SelectedSkill[]>([]);
  const [dataLoading, setDataLoading] = useState(false); // separate from authLoading
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit mode state
  const [editedSkills, setEditedSkills] = useState<SelectedSkill[]>([]);

  // Determine target ID:
  // If Admin AND ?id=X exists -> Use X
  // Else -> Use current user.id
  const targetId = useMemo(() => {
    if (!user) return null;
    const queryId = searchParams.get("id");
    if (user.role === "admin" && queryId) {
      return queryId;
    }
    return user.id;
  }, [user, searchParams]);

  const isOwnProfile = user?.id === targetId;

  // Fetch data once user is resolved
  useEffect(() => {
    if (!targetId) return;

    async function fetchData() {
      setDataLoading(true);
      try {
        const [userRes, skillsRes] = await Promise.all([
          api.get(`/users/${targetId}`),
          api.get(`/users/${targetId}/skills`),
        ]);
        const userData = userRes.data;

        // If visiting someone else who is still a Novice, bounce back
        if (userData.character_class === "Novice" && !isOwnProfile) {
          toast.error("คนนี้ยังไม่ได้ปลุกพลังเลย เทียบไม่ได้น้าา", {
            icon: "✨",
          });
          router.back();
          return;
        }

        setProfileUser(userData);
        const parsed = skillsRes.data.skills || [];
        setSkills(parsed);
        setEditedSkills(parsed);
      } catch (err) {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
        // router.push("/"); // Don't redirect on data error, potentially just show error
      } finally {
        setDataLoading(false);
      }
    }

    fetchData();
  }, [user, token, authLoading, router, targetId]);

  const handleSave = async () => {
    if (!profileUser || !token) return;
    setSaving(true);
    try {
      await api.put(`/users/${profileUser.id}/skills`, {
        skills: editedSkills,
      });

      setSkills(editedSkills);
      setIsEditing(false);
      toast.success("บันทึกข้อมูลสำเร็จ!");

      // Force refresh auth user to update context if needed (optional)
      // window.dispatchEvent(new Event("user-updated"));
    } catch (err) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Department
  const toggleDepartment = (deptName: string) => {
    // Check if we already have this department (fuzzy match)
    const existingIndex = editedSkills.findIndex((s) =>
      matchesDepartment(s.name, DEPARTMENTS.find((d) => d.name === deptName)!)
    );

    if (existingIndex !== -1) {
      const newSkills = [...editedSkills];
      newSkills.splice(existingIndex, 1);
      setEditedSkills(newSkills);
    } else {
      setEditedSkills([...editedSkills, { name: deptName, level: 1 }]);
    }
  };

  if (authLoading || dataLoading || !profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <ElementalLoader />
      </div>
    );
  }

  const themeColor =
    CLASS_COLORS[profileUser.character_class] || CLASS_COLORS.Warrior;
  const statColor = CLASS_STAT_COLORS[profileUser.character_class] || "#818cf8";
  const classIcon =
    CLASS_ICONS[profileUser.character_class] || CLASS_ICONS.Warrior;
  const classInfo =
    CLASS_INFO[profileUser.character_class] || CLASS_INFO.Warrior;

  const statsData = [
    { subject: "O", A: profileUser.ocean_openness, fullMark: 50 },
    { subject: "C", A: profileUser.ocean_conscientiousness, fullMark: 50 },
    { subject: "E", A: profileUser.ocean_extraversion, fullMark: 50 },
    { subject: "A", A: profileUser.ocean_agreeableness, fullMark: 50 },
    { subject: "N", A: profileUser.ocean_neuroticism, fullMark: 50 },
  ];

  /* Unused const oceanScores = {
    O: profileUser.ocean_openness,
    C: profileUser.ocean_conscientiousness,
    E: profileUser.ocean_extraversion,
    A: profileUser.ocean_agreeableness,
    N: profileUser.ocean_neuroticism,
  }; */

  const totalSkills = skills.length;
  const maxLevel = 1; // Default
  /* const avgLevel = 1; // Default */

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50/20 dark:bg-slate-900/20 px-3 py-4 md:p-8 transition-colors">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white mb-1">
              <UserIcon className="inline-block mr-1 md:mr-2" size={24} />
              {isOwnProfile
                ? "โปรไฟล์ของฉัน"
                : `โปรไฟล์ของ ${profileUser.name}`}
            </h1>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Star className="text-amber-400" size={14} />
                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                  Departments
                </span>
              </div>
              <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-white">
                {totalSkills}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Trophy className="text-purple-500" size={14} />
                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                  Class
                </span>
              </div>
              <p className="text-lg md:text-xl font-black text-slate-800 dark:text-white truncate">
                {profileUser.character_class}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Flame className="text-orange-500" size={14} />
                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                  Level
                </span>
              </div>
              <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-white">
                {profileUser.level}
              </p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* LEFT: User Card + Class Info */}
            <div className="lg:col-span-1 space-y-4 md:space-y-6">
              {/* User Card */}
              <div
                className={`bg-gradient-to-br ${themeColor} p-[2px] rounded-xl md:rounded-2xl`}
              >
                <div className="bg-white dark:bg-slate-800 rounded-[10px] md:rounded-xl p-4 md:p-6 text-center">
                  <div className="w-14 h-14 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600">
                    {classIcon}
                  </div>
                  <h2 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-white mb-1">
                    {profileUser.name}
                  </h2>
                  <div
                    className={`inline-block px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-bold bg-gradient-to-r ${themeColor} text-white`}
                  >
                    {profileUser.character_class} • Lv.{profileUser.level}
                  </div>
                  {/* OCEAN Chart */}
                  <div className="h-40 md:h-52 mt-3 md:mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        data={statsData}
                      >
                        <PolarGrid stroke="#cbd5e1" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{
                            fill: "#64748b",
                            fontSize: 11,
                            fontWeight: "bold",
                          }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 50]}
                          tick={false}
                          axisLine={false}
                        />
                        <Radar
                          dataKey="A"
                          stroke={statColor}
                          strokeWidth={2}
                          fill={statColor}
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Class Description */}
              <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-lg">{classInfo.emoji}</span>{" "}
                  {classInfo.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {classInfo.desc}
                </p>
                <div className="mb-3">
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mb-1.5 flex items-center gap-1">
                    <Award size={12} className="text-amber-500" /> จุดเด่น
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {classInfo.strengths.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-[10px] md:text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Departments (Replaces Skills) */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <h3 className="text-sm md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5 md:gap-2">
                    <Star className="text-amber-400" size={18} />
                    Departments ({skills.length})
                  </h3>
                  {isOwnProfile &&
                    (!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs md:text-sm font-medium flex items-center gap-1.5"
                      >
                        <Edit3 size={12} /> แก้ไข
                      </button>
                    ) : (
                      <div className="flex gap-1.5 md:gap-2">
                        <button
                          onClick={() => {
                            setEditedSkills(skills);
                            setIsEditing(false);
                          }}
                          className="p-1.5 md:p-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-600 dark:text-white rounded-lg"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-3 md:px-4 py-1.5 md:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs md:text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Save size={12} /> {saving ? "..." : "บันทึก"}
                        </button>
                      </div>
                    ))}
                </div>

                {!isEditing ? (
                  // View Mode
                  <div>
                    {skills.length === 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center shrink-0">
                          <AlertCircle
                            className="text-red-500 dark:text-red-200"
                            size={20}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-red-700 dark:text-red-200">
                            ยังไม่ได้ระบุสังกัด (Department)
                          </h4>
                          <p className="text-xs text-red-600 dark:text-red-300">
                            {isOwnProfile
                              ? "กรุณากด 'แก้ไข' เพื่อเลือกสังกัดของคุณ เพื่อให้ระบบจัดทีมได้ถูกต้อง"
                              : "ผู้ใช้นี้ยังไม่ได้ระบุสังกัด"}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {skills.length === 0 && !isEditing ? (
                        <div className="text-center w-full py-8 text-slate-400">
                          <p>ยังไม่มีข้อมูลสังกัด</p>
                          {isOwnProfile && (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="text-indigo-500 font-bold hover:underline"
                            >
                              เลือกสังกัด
                            </button>
                          )}
                        </div>
                      ) : (
                        skills.map((skill) => (
                          <span
                            key={skill.name}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 rounded-lg text-sm font-semibold"
                          >
                            {skill.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 mb-2">
                      เลือกสังกัดของคุณ (เลือกได้มากกว่า 1)
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {DEPARTMENTS.map((dept) => {
                        const isSelected = editedSkills.some((s) =>
                          matchesDepartment(s.name, dept)
                        );
                        return (
                          <button
                            key={dept.id}
                            onClick={() => toggleDepartment(dept.name)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left flex items-center justify-between ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-105"
                                : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                            }`}
                          >
                            <span>{dept.label || dept.name}</span>
                            {isSelected && <CheckCircle size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Level Legend */}

              {/* RPG Character Status */}
              <div
                className={`bg-gradient-to-br ${themeColor} p-[2px] rounded-xl md:rounded-2xl`}
              >
                <div className="bg-white dark:bg-slate-800 rounded-[10px] md:rounded-xl p-4 md:p-5">
                  <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-lg">⚔️</span>
                    Character Status
                  </h3>

                  {/* XP Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] md:text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">
                        EXP
                      </span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {Math.min(totalSkills * 150 + maxLevel * 100, 1000)} /
                        1000
                      </span>
                    </div>
                    <div className="h-3 md:h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (totalSkills * 150 + maxLevel * 100) / 10,
                            100
                          )}%`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                    </div>
                    <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                      {1000 -
                        Math.min(totalSkills * 150 + maxLevel * 100, 1000)}{" "}
                      EXP until Level {profileUser.level + 1}
                    </p>
                  </div>

                  {/* Adventurer Rank */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-3 text-center border border-amber-200 dark:border-amber-800/50">
                      <p className="text-[9px] md:text-[10px] text-amber-600 dark:text-amber-400 mb-1">
                        Adventurer Rank
                      </p>
                      <p className="text-lg md:text-xl font-black text-amber-700 dark:text-amber-300">
                        {totalSkills >= 10
                          ? "S"
                          : totalSkills >= 7
                          ? "A"
                          : totalSkills >= 5
                          ? "B"
                          : totalSkills >= 3
                          ? "C"
                          : totalSkills >= 1
                          ? "D"
                          : "E"}
                      </p>
                      <p className="text-[8px] md:text-[9px] text-amber-600/70 dark:text-amber-400/70">
                        {totalSkills >= 10
                          ? "Legendary"
                          : totalSkills >= 7
                          ? "Elite"
                          : totalSkills >= 5
                          ? "Veteran"
                          : totalSkills >= 3
                          ? "Regular"
                          : totalSkills >= 1
                          ? "Rookie"
                          : "Novice"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-800/20 rounded-lg p-3 text-center border border-indigo-200 dark:border-indigo-800/50">
                      <p className="text-[9px] md:text-[10px] text-indigo-600 dark:text-indigo-400 mb-1">
                        Power Level
                      </p>
                      <p className="text-lg md:text-xl font-black text-indigo-700 dark:text-indigo-300">
                        {Math.round(
                          (profileUser.ocean_openness +
                            profileUser.ocean_conscientiousness +
                            profileUser.ocean_extraversion +
                            profileUser.ocean_agreeableness +
                            (50 - profileUser.ocean_neuroticism)) /
                            2.5
                        )}
                      </p>
                      <p className="text-[8px] md:text-[9px] text-indigo-600/70 dark:text-indigo-400/70">
                        Combat Rating
                      </p>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="mb-4">
                    <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                      <Trophy size={12} className="text-amber-500" />{" "}
                      Achievements
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {/* Always unlocked */}
                      <span
                        className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-[9px] md:text-[10px] font-medium"
                        title="ทำ Assessment เสร็จ"
                      >
                        ✅ ปลุกพลัง
                      </span>
                      {/* Skill based */}
                      {totalSkills >= 1 && (
                        <span
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[9px] md:text-[10px] font-medium"
                          title="เพิ่ม Skill แรก"
                        >
                          ⭐ First Skill
                        </span>
                      )}
                      {totalSkills >= 5 && (
                        <span
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-[9px] md:text-[10px] font-medium"
                          title="มี 5 Skills"
                        >
                          🌟 Skill Collector
                        </span>
                      )}
                      {maxLevel >= 4 && (
                        <span
                          className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-[9px] md:text-[10px] font-medium"
                          title="มี Skill Level 4+"
                        >
                          🔥 Advanced
                        </span>
                      )}
                      {maxLevel >= 5 && (
                        <span
                          className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded text-[9px] md:text-[10px] font-medium"
                          title="มี Skill Level 5"
                        >
                          👑 Master
                        </span>
                      )}
                      {/* Locked achievements */}
                      {totalSkills < 5 && (
                        <span
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded text-[9px] md:text-[10px] font-medium opacity-50"
                          title="เพิ่ม 5 Skills เพื่อปลดล็อค"
                        >
                          🔒 ???
                        </span>
                      )}
                      {totalSkills < 10 && (
                        <span
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded text-[9px] md:text-[10px] font-medium opacity-50"
                          title="เพิ่ม 10 Skills เพื่อปลดล็อค"
                        >
                          🔒 ???
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fun Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                      <p className="text-lg md:text-xl">🗓️</p>
                      <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400">
                        Quests
                      </p>
                      <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">
                        {totalSkills + profileUser.level}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                      <p className="text-lg md:text-xl">💎</p>
                      <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400">
                        Gold
                      </p>
                      <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">
                        {(totalSkills * 100 + maxLevel * 50).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                      <p className="text-lg md:text-xl">⚡</p>
                      <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400">
                        Streak
                      </p>
                      <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">
                        {Math.min(profileUser.level, 7)} days
                      </p>
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between text-[10px] md:text-xs text-slate-400 dark:text-slate-500">
                    <span>ID: #{profileUser.id}</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-6 md:mt-8 text-center">
            <button
              onClick={() => router.push("/")}
              className="px-4 md:px-6 py-2 md:py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-white rounded-lg md:rounded-xl text-sm md:text-base font-medium flex items-center justify-center gap-1.5 md:gap-2 mx-auto transition-colors"
            >
              <ChevronLeft size={16} /> กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

import { Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <ElementalLoader />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
