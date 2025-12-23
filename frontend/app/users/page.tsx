"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Wand,
  Shield,
  Sword,
  Heart,
  Skull,
  Star,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Skill {
  name: string;
  level: number;
}

interface User {
  id: number;
  name: string;
  character_class: string;
  level: number;
  ocean_openness: number;
  ocean_conscientiousness: number;
  ocean_extraversion: number;
  ocean_agreeableness: number;
  ocean_neuroticism: number;
  skills: Skill[];
  is_available: boolean;
}

const CLASS_ICONS: Record<string, React.ReactNode> = {
  Mage: <Wand size={16} />,
  Paladin: <Shield size={16} />,
  Warrior: <Sword size={16} />,
  Cleric: <Heart size={16} />,
  Rogue: <Skull size={16} />,
};

const CLASS_COLORS: Record<string, string> = {
  Mage: "from-purple-500 to-indigo-500",
  Paladin: "from-amber-500 to-yellow-500",
  Warrior: "from-red-500 to-orange-500",
  Cleric: "from-emerald-500 to-teal-500",
  Rogue: "from-slate-600 to-slate-800",
};

const DEPARTMENTS = [
  { id: "all", name: "ทั้งหมด" },
  { id: "swp", name: "SWP & OD" },
  { id: "hrb", name: "HRBP" },
  { id: "tot", name: "Total Rewards" },
  { id: "er", name: "ER" },
  { id: "eng", name: "Engagement" },
  { id: "tal", name: "Talent Mgmt" },
  { id: "peo", name: "People Services" },
  { id: "com", name: "Compliance" },
  { id: "l_a", name: "L&D" },
  { id: "hr_", name: "HR AI" },
  { id: "suc", name: "SuccessFactors" },
  { id: "hr_d", name: "Dashboards" },
  { id: "pro", name: "Project Manager" },
];

function UserCard({ user }: { user: User }) {
  const [expanded, setExpanded] = useState(false);
  const visibleSkills = expanded ? user.skills : user.skills?.slice(0, 4);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${
            CLASS_COLORS[user.character_class] || "from-slate-400 to-slate-500"
          } flex items-center justify-center text-white`}
        >
          {CLASS_ICONS[user.character_class] || <Star size={20} />}
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 dark:text-white text-base">
            {user.name}
          </p>
          <p className="text-sm text-slate-500">
            {user.character_class} • Lv.{user.level}
          </p>
        </div>
      </div>

      {/* OCEAN */}
      <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-xs text-slate-400 mb-1">OCEAN</p>
        <div className="flex gap-1 text-xs">
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
            O:{user.ocean_openness}
          </span>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
            C:{user.ocean_conscientiousness}
          </span>
          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
            E:{user.ocean_extraversion}
          </span>
          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
            A:{user.ocean_agreeableness}
          </span>
          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
            N:{user.ocean_neuroticism}
          </span>
        </div>
      </div>

      {/* Skills */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-slate-400">
            Skills ({user.skills?.length || 0})
          </p>
          {user.skills?.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5"
            >
              {expanded ? (
                <>
                  ซ่อน <ChevronUp size={14} />
                </>
              ) : (
                <>
                  ดูทั้งหมด <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {visibleSkills?.map((skill, idx) => {
            // Different colors for each level
            const levelColors: Record<number, string> = {
              5: "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
              4: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
              3: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
              2: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
              1: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
            };
            const colorClass = levelColors[skill.level] || levelColors[1];

            return (
              <span
                key={idx}
                className={`px-2 py-1 rounded text-[10px] font-medium ${colorClass}`}
              >
                {skill.name.length > 25
                  ? skill.name.slice(0, 25) + "..."
                  : skill.name}{" "}
                Lv.{skill.level}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  useEffect(() => {
    axios
      .get(`${API_URL}/users`)
      .then((res) => {
        const parsed = res.data.map((u: any) => ({
          ...u,
          skills:
            typeof u.skills === "string"
              ? JSON.parse(u.skills)
              : u.skills || [],
        }));
        setUsers(parsed);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesDept =
      deptFilter === "all" ||
      user.name.toLowerCase().includes(deptFilter.toLowerCase());
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/20 dark:bg-slate-900/20 px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="text-indigo-500" />
            รายชื่อพนักงาน
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            ดูข้อมูล Skills และ OCEAN ของทุกคน
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department Dropdown */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:border-indigo-500 min-w-[180px]"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="mb-4 text-sm text-slate-500">
          แสดง {filteredUsers.length} จาก {users.length} คน
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Users className="mx-auto mb-2" size={40} />
            <p>ไม่พบข้อมูล</p>
          </div>
        )}
      </div>
    </div>
  );
}
