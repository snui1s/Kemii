"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
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
      const res = await api.post("/register", {
        ...formData,
        departments: selectedDepts,
      });

      const { access_token, user } = res.data;
      if (access_token && user) {
        toast.success("สมัครสมาชิกสำเร็จ!");
        login(access_token, user, true); // Use centralized login
      }
    } catch (err: any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = err.response?.data?.detail || "สมัครสมาชิกไม่สำเร็จ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex top items-center justify-center p-4">
      <div className="bg-[var(--background)]/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex justify-center">
        <div className="w-full p-8 md:p-12">
          <h2 className="text-2xl font-medium opacity-80 text-[var(--foreground)] mb-6 text-center">
            สร้างบัญชีใหม่
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  ชื่อที่ใช้แสดง (Display Name)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-[var(--muted)]">
                    <User size={20} />
                  </span>
                  <input
                    required
                    type="text"
                    maxLength={10}
                    placeholder="เบส, เอิร์ธ"
                    className="w-full pl-10 pr-4 py-2.5 text-[var(--foreground)] bg-black/5 dark:bg-white/5 border border-transparent focus:border-[var(--highlight)] rounded-xl outline-none transition placeholder:text-[var(--muted)]/50"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-[var(--muted)]">
                    <Mail size={20} />
                  </span>
                  <input
                    required
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-[var(--foreground)] bg-black/5 dark:bg-white/5 border border-transparent focus:border-[var(--highlight)] rounded-xl outline-none transition placeholder:text-[var(--muted)]/50"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-[var(--muted)]">
                    <Lock size={20} />
                  </span>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-[var(--foreground)] bg-black/5 dark:bg-white/5 border border-transparent focus:border-[var(--highlight)] rounded-xl outline-none transition placeholder:text-[var(--muted)]/50"
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
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                สังกัด (เลือกได้มากกว่า 1){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-black/5 dark:border-white/5 rounded-xl bg-black/5 dark:bg-white/5 custom-scrollbar">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = selectedDepts.includes(dept.name);
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => toggleDept(dept.name)}
                      className={`text-xs p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? "bg-[var(--highlight)] border-[var(--highlight)] text-white"
                          : "bg-[var(--background)] text-[var(--muted)] border-transparent hover:border-[var(--highlight)] hover:text-[var(--highlight)]"
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
              className="w-full bg-[var(--highlight)] hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:shadow-[var(--highlight)]/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="mt-6 text-center text-sm text-[var(--muted)]">
            มีบัญชีอยู่แล้ว?{" "}
            <Link
              href="/login"
              className="text-[var(--highlight)] font-bold hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
