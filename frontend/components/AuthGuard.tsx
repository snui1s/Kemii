"use client";
import { useEffect, useState } from "react";
import { Lock, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ElementalLoader from "@/components/ElementalLoader";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      // Use setTimeout to avoid synchronous state update warning
      const timer = setTimeout(() => setChecking(false), 0);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <ElementalLoader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full">
          <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-slate-400 dark:text-slate-500" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            จำกัดการเข้าถึง 🔒
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            ขออภัยครับ ฟีเจอร์นี้สำหรับสมาชิกเท่านั้น <br />
            กรุณาทำแบบประเมินบุคลิกภาพก่อนนะ
          </p>

          <Link
            href="/assessment"
            className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <ClipboardList size={20} />
            ไปทำแบบประเมิน
          </Link>

          <Link
            href="/"
            className="block mt-4 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
