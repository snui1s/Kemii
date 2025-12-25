"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import {
  Building2,
  CheckCircle,
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { DEPARTMENTS } from "@/data/departments";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleDept = (deptName: string) => {
    if (selectedDepts.includes(deptName)) {
      setSelectedDepts(selectedDepts.filter((d) => d !== deptName));
    } else {
      setSelectedDepts([...selectedDepts, deptName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDepts.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 แผนก");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/register`, {
        ...formData,
        departments: selectedDepts,
      });

      const { access_token, user } = res.data;
      if (access_token && user) {
        toast.success("สมัครสมาชิกสำเร็จ! 🎉");
        // Force refresh to ensure clean state as requested
        localStorage.setItem("access_token", access_token);
        window.location.href = "/";
      }
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = err.response?.data?.detail || "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex top items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden flex justify-center">
        <div className="w-full md:w-7/12 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
            สร้างบัญชีใหม่
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อที่ใช้แสดง (Display Name)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-700 dark:text-slate-300">
                    <User size={20} />
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="เบส, เอิร์ธ"
                    className="w-full pl-10 pr-4 py-2.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <Mail size={20} />
                  </span>
                  <input
                    required
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <Lock size={20} />
                  </span>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                สังกัด (เลือกได้มากกว่า 1){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = selectedDepts.includes(dept.name);
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => toggleDept(dept.name)}
                      className={`text-xs p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-slate-50 dark:text-slate-200"
                          : "bg-white text-slate-700 dark:text-slate-300 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-indigo-400 dark:text-slate-200"
                      }`}
                    >
                      <span className="truncate">{dept.name}</span>
                      {isSelected && <CheckCircle size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  ลงทะเบียน <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            มีบัญชีอยู่แล้ว?{" "}
            <Link
              href="/login"
              className="text-indigo-600 font-bold hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
