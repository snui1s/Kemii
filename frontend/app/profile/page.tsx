"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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
  id: number;
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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [skills, setSkills] = useState<SelectedSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit mode state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editedSkills, setEditedSkills] = useState<SelectedSkill[]>([]);

  // Fetch user data
  useEffect(() => {
    async function fetchData() {
      const userId = localStorage.getItem("myUserId");
      if (!userId) {
        toast.error("กรุณาเข้าสู่ระบบก่อน");
        router.push("/");
        return;
      }

      try {
        const [userRes, skillsRes] = await Promise.all([
          axios.get(`${API_URL}/users/${userId}`),
          axios.get(`${API_URL}/users/${userId}/skills`),
        ]);
        setUser(userRes.data);
        const parsed = skillsRes.data.skills || [];
        setSkills(parsed);
        setEditedSkills(parsed);
      } catch (err) {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  // Fetch departments for edit mode
  useEffect(() => {
    if (isEditing && departments.length === 0) {
      axios.get(`${API_URL}/skills`).then((res) => {
        setDepartments(res.data.departments);
        if (res.data.departments.length > 0) {
          setSelectedDept(res.data.departments[0].id);
        }
      });
    }
  }, [isEditing, departments.length]);

  // Filter skills by search
  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) {
      const dept = departments.find((d) => d.id === selectedDept);
      return dept?.skills || [];
    }
    const query = searchQuery.toLowerCase();
    const results: string[] = [];
    departments.forEach((dept) => {
      dept.skills.forEach((skill) => {
        if (skill.toLowerCase().includes(query)) {
          results.push(skill);
        }
      });
    });
    return results;
  }, [departments, selectedDept, searchQuery]);

  const toggleSkill = (skillName: string) => {
    const existing = editedSkills.find((s) => s.name === skillName);
    if (existing) {
      setEditedSkills(editedSkills.filter((s) => s.name !== skillName));
    } else {
      setEditedSkills([...editedSkills, { name: skillName, level: 3 }]);
    }
  };

  const updateLevel = (skillName: string, level: number) => {
    setEditedSkills(
      editedSkills.map((s) => (s.name === skillName ? { ...s, level } : s))
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await axios.put(`${API_URL}/users/${user.id}/skills`, {
        skills: editedSkills,
      });
      setSkills(editedSkills);
      setIsEditing(false);
      toast.success("บันทึก Skills สำเร็จ!");
    } catch (err) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const themeColor = CLASS_COLORS[user.character_class] || CLASS_COLORS.Warrior;
  const statColor = CLASS_STAT_COLORS[user.character_class] || "#818cf8";
  const classIcon = CLASS_ICONS[user.character_class] || CLASS_ICONS.Warrior;
  const classInfo = CLASS_INFO[user.character_class] || CLASS_INFO.Warrior;

  const statsData = [
    { subject: "O", A: user.ocean_openness, fullMark: 50 },
    { subject: "C", A: user.ocean_conscientiousness, fullMark: 50 },
    { subject: "E", A: user.ocean_extraversion, fullMark: 50 },
    { subject: "A", A: user.ocean_agreeableness, fullMark: 50 },
    { subject: "N", A: user.ocean_neuroticism, fullMark: 50 },
  ];

  const oceanScores = {
    O: user.ocean_openness,
    C: user.ocean_conscientiousness,
    E: user.ocean_extraversion,
    A: user.ocean_agreeableness,
    N: user.ocean_neuroticism,
  };

  // Quick stats
  const totalSkills = skills.length;
  const maxLevel =
    skills.length > 0 ? Math.max(...skills.map((s) => s.level)) : 0;
  const avgLevel =
    skills.length > 0
      ? (skills.reduce((a, b) => a + b.level, 0) / skills.length).toFixed(1)
      : "0";

  return (
    <div className="min-h-screen bg-slate-50/20 dark:bg-slate-900/20 px-3 py-4 md:p-8 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white mb-1">
            <UserIcon className="inline-block mr-1 md:mr-2" size={24} />
            โปรไฟล์ของฉัน
          </h1>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Star className="text-amber-400" size={14} />
              <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                Skills
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
                Max Lv.
              </span>
            </div>
            <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-white">
              {maxLevel}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Flame className="text-orange-500" size={14} />
              <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                Avg Lv.
              </span>
            </div>
            <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-white">
              {avgLevel}
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
                  {user.name}
                </h2>
                <div
                  className={`inline-block px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-bold bg-gradient-to-r ${themeColor} text-white`}
                >
                  {user.character_class} • Lv.{user.level}
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
                <span className="text-lg">{classInfo.emoji}</span>
                {classInfo.title}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-3">
                {classInfo.desc}
              </p>

              {/* Strengths */}
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

              {/* Best With */}
              <div>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mb-1.5 flex items-center gap-1">
                  <Users size={12} className="text-indigo-500" />{" "}
                  เข้ากันได้ดีกับ
                </p>
                <div className="flex flex-wrap gap-1">
                  {classInfo.bestWith.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-[10px] md:text-xs font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* OCEAN Stats Legend */}
            <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Target size={16} className="text-indigo-500" />
                OCEAN Stats
              </h3>
              <div className="space-y-2">
                {OCEAN_LABELS.map((item) => {
                  const score =
                    oceanScores[item.key as keyof typeof oceanScores];
                  const percentage = Math.round((score / 50) * 100);
                  return (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                        {item.key}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] md:text-xs mb-0.5">
                          <span className="text-slate-600 dark:text-slate-400">
                            {item.desc}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-white">
                            {score}
                          </span>
                        </div>
                        <div className="h-1.5 md:h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: statColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Skills + Level Legend */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Skills Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h3 className="text-sm md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5 md:gap-2">
                  <Star className="text-amber-400" size={18} />
                  Skills ของฉัน ({skills.length})
                </h3>
                {!isEditing ? (
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
                )}
              </div>

              {!isEditing ? (
                // View Mode
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2 max-h-[350px] md:max-h-[400px] overflow-y-auto">
                  {skills.length === 0 ? (
                    <div className="col-span-2 text-center py-8">
                      <Star
                        className="mx-auto mb-2 text-slate-300 dark:text-slate-600"
                        size={32}
                      />
                      <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm">
                        ยังไม่มี Skills
                      </p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
                      >
                        + เพิ่ม Skills
                      </button>
                    </div>
                  ) : (
                    skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 px-3 md:px-4 py-2 md:py-2.5 rounded-lg"
                      >
                        <span className="text-slate-800 dark:text-white text-xs md:text-sm font-medium truncate pr-2">
                          {skill.name}
                        </span>
                        <div className="flex gap-0.5 md:gap-1 shrink-0">
                          {LEVEL_LABELS.map((l) => (
                            <div
                              key={l.level}
                              className={`w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center text-[10px] md:text-xs font-bold ${
                                skill.level >= l.level
                                  ? `${l.color} text-white`
                                  : "bg-slate-200 dark:bg-slate-600 text-slate-400"
                              }`}
                              title={l.label}
                            >
                              {l.level}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-3 md:space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search
                      className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="ค้นหา Skill..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 md:pl-10 pr-3 py-1.5 md:py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-xs md:text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Departments */}
                  {!searchQuery && (
                    <div className="flex flex-wrap gap-1.5 md:gap-2 max-h-24 overflow-y-auto">
                      {departments.map((dept) => (
                        <button
                          key={dept.id}
                          onClick={() => setSelectedDept(dept.id)}
                          className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium transition whitespace-nowrap ${
                            selectedDept === dept.id
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                          title={dept.name}
                        >
                          {dept.id
                            .replace(/_/g, " ")
                            .toUpperCase()
                            .replace(" AND ", "&")}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Available Skills */}
                  <div className="flex flex-wrap gap-1 md:gap-2 max-h-28 md:max-h-32 overflow-y-auto">
                    {filteredSkills.map((skill, idx) => {
                      const isSelected = editedSkills.some(
                        (s) => s.name === skill
                      );
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleSkill(skill)}
                          className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium transition border ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-500"
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Skills with Level */}
                  {editedSkills.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-600 pt-3">
                      <p className="text-[10px] md:text-xs text-slate-500 mb-2">
                        Skills ที่เลือก ({editedSkills.length})
                      </p>
                      <div className="space-y-1.5 md:space-y-2 max-h-36 md:max-h-44 overflow-y-auto">
                        {editedSkills.map((skill) => (
                          <div
                            key={skill.name}
                            className="flex items-center gap-2 md:gap-3 bg-slate-50 dark:bg-slate-700/50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg"
                          >
                            <button
                              onClick={() => toggleSkill(skill.name)}
                              className="text-slate-400 hover:text-red-500 shrink-0"
                            >
                              <X size={12} />
                            </button>
                            <span className="flex-1 text-slate-800 dark:text-white text-xs md:text-sm truncate">
                              {skill.name}
                            </span>
                            <div className="flex gap-0.5 shrink-0">
                              {LEVEL_LABELS.map((l) => (
                                <button
                                  key={l.level}
                                  onClick={() =>
                                    updateLevel(skill.name, l.level)
                                  }
                                  className={`w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center text-[10px] md:text-xs font-bold transition ${
                                    skill.level >= l.level
                                      ? `${l.color} text-white`
                                      : "bg-slate-200 dark:bg-slate-600 text-slate-400"
                                  }`}
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
                </div>
              )}
            </div>

            {/* Level Legend */}
            <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                ระดับความเชี่ยวชาญ
              </h3>
              <div className="flex flex-wrap gap-3 md:gap-4">
                {LEVEL_LABELS.map((l) => (
                  <div key={l.level} className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 md:w-7 md:h-7 rounded ${l.color} text-white flex items-center justify-center text-xs md:text-sm font-bold`}
                    >
                      {l.level}
                    </div>
                    <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

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
                    {1000 - Math.min(totalSkills * 150 + maxLevel * 100, 1000)}{" "}
                    EXP until Level {user.level + 1}
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
                        (user.ocean_openness +
                          user.ocean_conscientiousness +
                          user.ocean_extraversion +
                          user.ocean_agreeableness +
                          (50 - user.ocean_neuroticism)) /
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
                    <Trophy size={12} className="text-amber-500" /> Achievements
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
                      {totalSkills + user.level}
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
                      {Math.min(user.level, 7)} days
                    </p>
                  </div>
                </div>

                {/* User ID */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between text-[10px] md:text-xs text-slate-400 dark:text-slate-500">
                  <span>ID: #{user.id.toString().padStart(4, "0")}</span>
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
  );
}
