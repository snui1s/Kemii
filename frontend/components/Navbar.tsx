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
  Menu, // Added
  X, // Added
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
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Added mobile menu state

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

  const handleProtectedLink = (e: React.MouseEvent, href: string) => {
    if (!myData) {
      e.preventDefault();
      toast.error("🔒 กรุณาทำแบบประเมินก่อนใช้งานฟีเจอร์นี้ครับ", {
        style: {
          background: "#334155",
          color: "#fff",
        },
      });
    }
  };

  if (!mounted) return null;

  return (
    <>
      <nav className="bg-slate-100 dark:bg-slate-900 backdrop-blur-md text-slate-600 dark:text-slate-300 p-3 sm:p-4 sticky top-0 z-50 shadow-sm border-b border-slate-200/50 dark:border-slate-800 transition-colors duration-300">
        <div className="container mx-auto flex justify-between items-center gap-2">
          {/* LOGO AREA */}
          <Link
            href="/"
            className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white hover:text-green-500 dark:hover:text-green-400 transition shrink-0"
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
            {/* ซ่อนชื่อในมือถือ (hidden) โชว์ใน Tablet ขึ้นไป (sm:inline) */}
            <span className="hidden sm:inline font-banana">Kemii</span>
          </Link>

          {/* RIGHT SIDE ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            {/* DESKTOP MENU LINKS - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3 sm:gap-4 lg:gap-6">
              {/* 1. ประวัติทีม */}
              <Link
                href="/team-history"
                onClick={(e) => handleProtectedLink(e, "/team-history")}
                className={`flex items-center gap-1.5 transition text-base font-medium ${
                  myData
                    ? "hover:text-green-600 dark:hover:text-green-400"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
                title="ประวัติทีม"
              >
                {myData ? (
                  <Users className="w-[18px] h-[18px]" />
                ) : (
                  <Lock className="w-[18px] h-[18px]" />
                )}
                <span>ทีม</span>
              </Link>

              {/* 2. สร้างทีม */}
              <Link
                href="/build-team"
                onClick={(e) => handleProtectedLink(e, "/build-team")}
                className={`flex items-center gap-1.5 transition text-base font-medium ${
                  myData
                    ? "hover:text-green-600 dark:hover:text-green-400"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
                title="สร้างทีม"
              >
                {myData ? (
                  <UserPlus className="w-[18px] h-[18px]" />
                ) : (
                  <Lock className="w-[18px] h-[18px]" />
                )}
                <span>สร้างทีม</span>
              </Link>

              {/* 3. จัดทีม AI */}
              <Link
                href="/grouping"
                onClick={(e) => handleProtectedLink(e, "/grouping")}
                className={`flex items-center gap-1.5 transition text-base font-medium ${
                  myData
                    ? "hover:text-green-600 dark:hover:text-green-400"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
                title="จัดทีม AI"
              >
                {myData ? (
                  <Shuffle className="w-[18px] h-[18px]" />
                ) : (
                  <Lock className="w-[18px] h-[18px]" />
                )}
                <span>จัดทีม AI</span>
              </Link>
            </div>

            {/* DIVIDER & THEME */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setShowInfo(true)}
                className="text-slate-400 hover:text-green-400 transition-colors p-1"
                title="เกี่ยวกับธาตุ"
              >
                <HelpCircle size={20} />
              </button>

              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
              <ThemeToggle />
            </div>

            {/* USER PROFILE - Desktop */}
            <div className="hidden lg:flex items-center">
              {myData ? (
                <div className="flex items-center gap-2 pl-2">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm max-w-[140px]">
                    <span className="text-lg animate-bounce-slow leading-none">
                      {getAnimalEmoji(myData.animal)}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-green-400 text-sm truncate">
                      {myData.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    title="ออกจากระบบ"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/assessment"
                  className="flex items-center gap-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-full text-sm font-bold transition shadow-lg shadow-green-900/20 hover:scale-105 active:scale-95 ml-2 whitespace-nowrap"
                >
                  <ClipboardList size={18} />
                  <span>เริ่มทำแบบประเมิน</span>
                </Link>
              )}
            </div>

            {/* MOBILE TOGGLE & ACTIONS - Visible on Mobile (< lg) */}
            <div className="flex lg:hidden items-center gap-3">
              <ThemeToggle />

              {/* Mobile: Show minimal profile or Start button if space permits, or put in menu? 
                   Let's put primary action (Start Assessment) outside if user not logged in for better conversion.
               */}
              {!myData && (
                <Link
                  href="/assessment"
                  className="flex items-center justify-center bg-green-600 text-white w-8 h-8 rounded-full shadow-md"
                >
                  <ClipboardList size={16} />
                </Link>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-5 duration-200">
            {/* Mobile User Profile Section */}
            {myData && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getAnimalEmoji(myData.animal)}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {myData.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {myData.animal}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}

            <div className="space-y-1">
              <Link
                href="/team-history"
                onClick={(e) => {
                  handleProtectedLink(e, "/team-history");
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl font-medium transition ${
                  myData
                    ? "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {myData ? <Users size={20} /> : <Lock size={20} />}
                ประวัติทีม
              </Link>

              <Link
                href="/build-team"
                onClick={(e) => {
                  handleProtectedLink(e, "/build-team");
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl font-medium transition ${
                  myData
                    ? "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {myData ? <UserPlus size={20} /> : <Lock size={20} />}
                สร้างทีม
              </Link>

              <Link
                href="/grouping"
                onClick={(e) => {
                  handleProtectedLink(e, "/grouping");
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl font-medium transition ${
                  myData
                    ? "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {myData ? <Shuffle size={20} /> : <Lock size={20} />}
                จัดทีม AI
              </Link>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

            <button
              onClick={() => {
                setShowInfo(true);
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 p-3 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition w-full text-left"
            >
              <HelpCircle size={20} />
              เกี่ยวกับธาตุ
            </button>

            {!myData && (
              <Link
                href="/assessment"
                onClick={() => setIsMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 w-full bg-green-600 text-white p-3 rounded-xl font-bold shadow-green-900/20 shadow-lg active:scale-95 transition"
              >
                <ClipboardList size={20} />
                เริ่มทำแบบประเมิน
              </Link>
            )}
          </div>
        )}
      </nav>
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  );
}
