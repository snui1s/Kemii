"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Users, Search } from "lucide-react";
import UserCard from "@/components/UserCard";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DEPARTMENTS, matchesDepartment } from "@/data/departments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  role?: "user" | "admin";
}

export default function UsersPage() {
  const { user: currentUser, token } = useAuth();
  /* Removed duplicate state: users, loading */
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const fetchUsers = async (): Promise<User[]> => {
    const res = await axios.get(`${API_URL}/users`);
    return res.data.map((u: any) => ({
      ...u,
      skills:
        typeof u.skills === "string" ? JSON.parse(u.skills) : u.skills || [],
    }));
  };

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const handlePromote = async (targetId: number, currentRole: string) => {
    if (!token) return;
    const newRole = currentRole === "admin" ? "user" : "admin";
    const action = newRole === "admin" ? "Promote" : "Demote";

    toast(
      (t) => (
        <div className="flex flex-col items-center gap-4 min-w-[260px] py-2">
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
              {action === "Promote" ? "แต่งตั้ง Admin? 👑" : "ปลดตำแหน่ง? 📉"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {action === "Promote"
                ? "คุณแน่ใจนะว่าจะมอบพลัง GOD ให้เขา?"
                : "ต้องการดึงเขากลับมาเป็นคนธรรมดาใช่มั้ย?"}
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
              onClick={async () => {
                toast.dismiss(t.id);
                setActionLoadingId(targetId);
                try {
                  await axios.put(
                    `${API_URL}/admin/users/${targetId}/role`,
                    { role: newRole },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  toast.success(
                    newRole === "admin"
                      ? "แต่งตั้ง Admin เรียบร้อย! 👑"
                      : "ลดระดับเป็น User เรียบร้อย"
                  );
                  queryClient.invalidateQueries({ queryKey: ["users"] });
                } catch (err) {
                  console.error(err);
                  toast.error("เกิดข้อผิดพลาด");
                } finally {
                  setActionLoadingId(null);
                }
              }}
              className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition transform active:scale-95"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      ),
      {
        duration: 3000,
        className:
          "!bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl",
        style: { color: "inherit" },
      }
    );
  };

  const handleDelete = async (targetId: number) => {
    if (!token) return;

    toast(
      (t) => (
        <div className="flex flex-col items-center gap-4 min-w-[260px] py-2">
          <div className="text-center">
            <h3 className="font-bold text-lg text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
              ลบผู้ใช้ถาวร? <span className="text-2xl">🗑️</span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              ข้อมูลจะหายไปตลอดกาล แน่ใจนะ?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg transition"
            >
              เก็บไว้ก่อน
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setActionLoadingId(targetId);
                try {
                  await axios.delete(`${API_URL}/admin/users/${targetId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  toast.success("ลบผู้ใช้เรียบร้อยแล้ว 🗑️");
                  queryClient.invalidateQueries({ queryKey: ["users"] });
                } catch (err) {
                  console.error(err);
                  toast.error("ลบไม่สำเร็จ");
                } finally {
                  setActionLoadingId(null);
                }
              }}
              className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition transform active:scale-95"
            >
              ลบเลย
            </button>
          </div>
        </div>
      ),
      {
        duration: 3000,
        className:
          "!bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl",
        style: { color: "inherit" },
      }
    );
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name
      .toLowerCase()
      .includes(search.toLowerCase());

    let matchesDept = true;
    if (deptFilter !== "all") {
      const targetDept = DEPARTMENTS.find((d) => d.id === deptFilter);
      if (targetDept) {
        matchesDept = user.skills.some((s) =>
          matchesDepartment(s.name, targetDept)
        );
      }
    }

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
              className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department Dropdown */}
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white h-11 rounded-xl">
              <SelectValue placeholder="เลือกแผนก" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.label || dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="mb-4 text-sm text-slate-500">
          แสดง {filteredUsers.length} จาก {users.length} คน
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const calculatedDepartments = DEPARTMENTS.filter((d) =>
              user.skills.some((s) => matchesDepartment(s.name, d))
            ).map((d) => d.label || d.name);

            return (
              <UserCard
                key={user.id}
                id={user.id}
                name={user.name}
                characterClass={user.character_class}
                type={`Lv.${user.level}`}
                scores={{
                  Openness: user.ocean_openness,
                  Conscientiousness: user.ocean_conscientiousness,
                  Extraversion: user.ocean_extraversion,
                  Agreeableness: user.ocean_agreeableness,
                  Neuroticism: user.ocean_neuroticism,
                }}
                departments={calculatedDepartments}
                isOwnCard={user.id === currentUser?.id}
                allowFlip={false}
                showFullStats={true}
                currentUserRole={currentUser?.role as "admin" | "user"}
                userRole={user.role as "admin" | "user"}
                onPromote={
                  actionLoadingId === user.id
                    ? undefined
                    : () => handlePromote(user.id, user.role || "user")
                }
                onDelete={
                  actionLoadingId === user.id
                    ? undefined
                    : () => handleDelete(user.id)
                }
              />
            );
          })}
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
