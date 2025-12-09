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
  Lock,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { ThemeToggle } from "./ThemeToggle";
import InfoModal from "./InfoModal";

export default function Navbar() {
  const router = useRouter();
  const [myData, setMyData] = useState<{ name: string; animal: string } | null>(
    null
  );
  const [mounted, setMounted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

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

    const timer = setTimeout(() => {
      setMounted(true);
      checkUser();
    }, 0);

    window.addEventListener("user-updated", checkUser);
    window.addEventListener("storage", checkUser);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("user-updated", checkUser);
      window.removeEventListener("storage", checkUser);
    };
  }, []);

  const handleLogout = () => {
    toast(
      (t) => (
        <div className="flex flex-col items-center gap-4 min-w-[260px] py-2">
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
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
        className:
          "!bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl",
        style: {
          color: "inherit",
        },
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

  // ✅ ฟังก์ชันเช็คก่อนกดลิงก์
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleProtectedLink = (e: React.MouseEvent, href: string) => {
    if (!myData) {
      e.preventDefault(); // ห้ามเปลี่ยนหน้า
      toast.error("🔒 กรุณาทำแบบประเมินก่อนใช้งานฟีเจอร์นี้ครับ", {
        style: {
          background: "#334155",
          color: "#fff",
        },
      });
      //router.push("/assessment");
    }
  };

  if (!mounted) return null;

  return (
    <>
      <nav className="bg-slate-100 dark:bg-slate-900 backdrop-blur-md text-slate-600 dark:text-slate-300 p-4 sticky top-0 z-50 shadow-sm border-b border-slate-200/50 dark:border-slate-800 transition-colors duration-300">
        <div className="container mx-auto flex justify-between items-center">
          <Link
            href="/"
            className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              fill="none"
              className="w-8 h-8"
            >
              <circle cx="16" cy="16" r="16" fill="#0f172a" />

              <path
                d="M16 28c6.627 0 12-5.373 12-12S22.627 4 16 4 4 9.373 4 16s5.373 12 12 12z"
                stroke="#6366f1"
                strokeWidth="2"
                strokeOpacity="0.5"
              />

              <circle cx="16" cy="16" r="6" fill="url(#grad1)" />
              <circle cx="26" cy="16" r="2" fill="#22c55e" />
              <circle cx="8" cy="22" r="1.5" fill="#eab308" />

              <defs>
                <linearGradient
                  id="grad1"
                  x1="10"
                  y1="10"
                  x2="22"
                  y2="22"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>

            <span className="hidden sm:inline font-banana">Kemii</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* 1. ประวัติทีม */}
              <Link
                href="/team-history"
                onClick={(e) => handleProtectedLink(e, "/team-history")}
                className={`flex items-center gap-1 transition text-sm sm:text-base font-medium ${
                  myData
                    ? "hover:text-green-600 dark:hover:text-green-400"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {myData ? <Users size={18} /> : <Lock size={18} />}
                <span className="hidden md:inline">ทีม</span>
              </Link>

              {/* 2. สร้างทีม */}
              <Link
                href="/build-team"
                onClick={(e) => handleProtectedLink(e, "/build-team")}
                className={`flex items-center gap-1 transition text-sm sm:text-base font-medium ${
                  myData
                    ? "hover:text-green-600 dark:hover:text-green-400"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {myData ? <UserPlus size={18} /> : <Lock size={18} />}
                <span className="hidden md:inline">สร้างทีม</span>
              </Link>

              {/* 3. จัดทีม AI */}
              <Link
                href="/grouping"
                onClick={(e) => handleProtectedLink(e, "/grouping")}
                className={`flex items-center gap-1 transition text-sm sm:text-base font-medium ${
                  myData
                    ? "hover:text-green-600 dark:hover:text-green-400"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {myData ? <Shuffle size={18} /> : <Lock size={18} />}
                <span className="hidden md:inline">จัดทีม AI</span>
              </Link>
            </div>

            <button
              onClick={() => setShowInfo(true)}
              className="text-slate-400 hover:text-blue-500 transition-colors"
              title="เกี่ยวกับธาตุ"
            >
              <HelpCircle size={20} />
            </button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <ThemeToggle />

            {/* User Section */}
            {myData ? (
              <div className="flex items-center gap-3 pl-2">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span className="text-lg animate-bounce-slow">
                    {getAnimalEmoji(myData.animal)}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-green-400 text-sm max-w-20 sm:max-w-[120px] truncate">
                    {myData.name}
                  </span>
                </div>
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
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  );
}
