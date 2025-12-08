"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  ClipboardList,
  LogOut,
  Shuffle,
  UserPlus,
  Orbit,
} from "lucide-react";
import toast from "react-hot-toast";
import { ThemeToggle } from "./ThemeToggle"; // ✅ อย่าลืม Import

export default function Navbar() {
  const router = useRouter();
  const [myData, setMyData] = useState<{ name: string; animal: string } | null>(
    null
  );
  const [mounted, setMounted] = useState(false); // กัน Hydration Error

  useEffect(() => {
    const checkUser = () => {
      const name = localStorage.getItem("myName");
      const animal = localStorage.getItem("myAnimal");
      if (name && animal) {
        setMyData({ name, animal });
      } else {
        setMyData(null);
      }
    };

    // 👇 ใช้ setTimeout เพื่อแก้ Error "synchronous render"
    const timer = setTimeout(() => {
      setMounted(true); // บอกว่าโหลดเสร็จแล้ว
      checkUser(); // ดึงข้อมูล User
    }, 0);

    // Event Listener ยังคงใส่ไว้ได้เลย (หรือจะย้ายไปใน timeout ก็ได้ แต่แบบนี้อ่านง่ายกว่า)
    window.addEventListener("user-updated", checkUser);
    window.addEventListener("storage", checkUser);

    return () => {
      clearTimeout(timer); // Cleanup timer
      window.removeEventListener("user-updated", checkUser);
      window.removeEventListener("storage", checkUser);
    };
  }, []);

  const handleLogout = () => {
    toast(
      (t) => (
        <div className="flex flex-col items-center gap-4 min-w-[260px] py-2">
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
              จะหนีไปแล้วเหรอ? <span className="text-2xl">🥺</span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              ข้อมูลประวัติในเครื่องจะหายไปนะ
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg transition"
            >
              อยู่ต่อ
            </button>

            <button
              onClick={() => {
                toast.dismiss(t.id);
                localStorage.removeItem("myUserId");
                localStorage.removeItem("myName");
                localStorage.removeItem("myAnimal");
                localStorage.removeItem("myScores");
                setMyData(null);
                window.dispatchEvent(new Event("user-updated"));
                toast.success("บ๊ายบาย! ไว้เจอกันใหม่ครับ 👋");
                router.push("/");
              }}
              className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition transform active:scale-95"
            >
              ออกเลย
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        style: {
          background: "var(--background)", // ให้ Toast เปลี่ยนสีตามธีม (ต้องไปแก้ css variables หรือ hardcode เอา)
          padding: "16px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.2)",
        },
        className: "dark:bg-slate-800 dark:text-white", // เพิ่ม class dark ให้ toast
      }
    );
  };

  const getAnimalEmoji = (animal: string) => {
    if (animal.includes("กระทิง")) return "🔥";
    if (animal.includes("อินทรี")) return "🦅";
    if (animal.includes("หนู")) return "🐁";
    if (animal.includes("หมี")) return "🐻";
    return "👤";
  };

  if (!mounted) return null;

  return (
    // ✨ เพิ่ม dark:bg-slate-900 และ dark:border-slate-800 ให้ Navbar เปลี่ยนสี
    <nav className="bg-slate-100 dark:bg-slate-900 backdrop-blur-md text-slate-600 dark:text-slate-300 p-4 sticky top-0 z-50 shadow-sm border-b border-slate-200/50 dark:border-slate-800 transition-colors duration-300">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo Section */}
        <Link
          href="/"
          className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition"
        >
          <Orbit size={28} className="text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline font-banana">Kemii</span>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Menu Links (ซ่อนบนมือถือถ้าจอเล็กจัดๆ แต่ปกติ flex จะจัดการให้) */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition text-sm sm:text-base font-medium"
            >
              <Users size={18} />
              <span className="hidden md:inline">ทีม</span>
            </Link>

            <Link
              href="/build-team"
              className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition text-sm sm:text-base font-medium"
            >
              <UserPlus size={18} />
              <span className="hidden md:inline">สร้างทีม</span>
            </Link>

            <Link
              href="/grouping"
              className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition text-sm sm:text-base font-medium"
            >
              <Shuffle size={18} />
              <span className="hidden md:inline">จัดทีม AI</span>
            </Link>
          </div>

          {/* ✨ Divider: เส้นขีดคั่นกลาง (เพิ่มความสวยงาม) */}
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>

          {/* ✨ Theme Toggle: วางตรงนี้ สวยสุด! */}
          <ThemeToggle />

          {/* User Section */}
          {myData ? (
            <div className="flex items-center gap-3 pl-2">
              {/* Profile Badge */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="text-lg animate-bounce-slow">
                  {getAnimalEmoji(myData.animal)}
                </span>
                <span className="font-bold text-slate-700 dark:text-green-400 text-sm max-w-20 sm:max-w-[120px] truncate">
                  {myData.name}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link
              href="/assessment"
              className="flex items-center gap-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-full text-sm font-bold transition shadow-lg shadow-green-900/20 hover:scale-105 active:scale-95 ml-2"
            >
              <ClipboardList size={18} />
              <span className="hidden sm:inline">เริ่มทำแบบประเมิน</span>
              <span className="inline sm:hidden">เริ่มเลย</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
