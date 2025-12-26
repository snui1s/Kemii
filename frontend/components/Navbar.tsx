"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  LogOut,
  UserPlus,
  Lock,
  HelpCircle,
  Menu,
  Scroll,
  X,
  Wand, // Mage
  Shield, // Paladin
  Sword, // Warrior
  Heart, // Cleric
  Skull, // Rogue
  User as UserIcon,
  LogIn,
} from "lucide-react";
import toast from "react-hot-toast";
import { ThemeToggle } from "./ThemeToggle";
import InfoModal from "./InfoModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Use setTimeout to avoid synchronous state update warning
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
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
              ยังไม่ได้ทำเควสเลยนะ
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
                logout();
                toast.success("บ๊ายบาย! ไว้เจอกันใหม่ครับ 👋");
              }}
              className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition transform active:scale-95"
            >
              ออกเลย
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

  // ✅ 4. ฟังก์ชันเลือกไอคอนตามอาชีพ (RPG Theme)
  const getClassIcon = (cls: string) => {
    // เช็คชื่ออาชีพ (เผื่อ Backend ส่งมาเป็น Mage หรือ นักเวทย์)
    const c = cls.toLowerCase();

    if (c.includes("mage") || c.includes("เวทย์"))
      return <Wand size={18} className="text-purple-500" />;
    if (c.includes("paladin") || c.includes("อัศวิน"))
      return <Shield size={18} className="text-yellow-500" />;
    if (c.includes("warrior") || c.includes("นักรบ"))
      return <Sword size={18} className="text-red-500" />;
    if (c.includes("cleric") || c.includes("นักบวช"))
      return <Heart size={18} className="text-green-500" />;
    if (c.includes("rogue") || c.includes("โจร"))
      return <Skull size={18} className="text-blue-500" />;

    return <UserIcon size={18} />;
  };

  const toastCooldown = useRef(false);

  const handleProtectedLink = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault();

      if (toastCooldown.current) return;

      toastCooldown.current = true;
      setTimeout(() => {
        toastCooldown.current = false;
      }, 3000);

      toast.error("🔒 กรุณาทำพิธีปลุกพลังก่อนใช้งานครับ", {
        style: {
          background: "#334155",
          color: "#fff",
        },
        id: "assessment-error",
        duration: 3000,
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
            className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white hover:text-indigo-400 transition shrink-0"
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
            {/* DESKTOP MENU LINKS */}
            <div className="hidden lg:flex items-center gap-3 sm:gap-4 lg:gap-6">
              <Link
                href="/quests"
                onClick={(e) => handleProtectedLink(e, "/quests")}
                className={`flex items-center gap-1.5 transition text-base font-medium ${
                  user
                    ? "hover:text-amber-600 dark:hover:text-amber-400"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {user ? (
                  <Scroll size={18} className="text-amber-500" />
                ) : (
                  <Lock size={18} />
                )}
                <span>เควส</span>
              </Link>

              <Link
                href="/users"
                onClick={(e) => handleProtectedLink(e, "/users")}
                className={`flex items-center gap-1.5 transition text-base font-medium ${
                  user
                    ? "hover:text-indigo-600 dark:hover:text-indigo-400"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {user ? <Users size={18} /> : <Lock size={18} />}
                <span>สมาชิกกิลด์</span>
              </Link>
            </div>

            {/* DIVIDER & THEME */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setShowInfo(true)}
                className="text-slate-400 hover:text-indigo-400 transition-colors p-1"
                title="คู่มือคลาส"
              >
                <HelpCircle size={20} />
              </button>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
              <ThemeToggle />
            </div>

            {/* USER PROFILE - Desktop */}
            <div className="hidden lg:flex items-center">
              {user ? (
                <div className="pl-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none">
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm min-w-[120px] hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer">
                        {/* Icon Class */}
                        <div className="p-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                          {getClassIcon(user.character_class)}
                        </div>

                        <div className="flex flex-col leading-none text-left">
                          <span className="font-bold text-slate-700 dark:text-indigo-300 text-sm truncate max-w-[80px]">
                            {user.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Lv.{user.level}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/profile")}>
                        <UserIcon className="mr-2 h-4 w-4" /> Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-400 dark:hover:text-indigo-400 transition"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-md shadow-indigo-500/20 active:scale-95"
                  >
                    <UserPlus size={18} />
                    <span>สมัครสมาชิก</span>
                  </Link>
                </div>
              )}
            </div>

            {/* MOBILE TOGGLE & ACTIONS */}
            <div className="flex lg:hidden items-center gap-3">
              <ThemeToggle />

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
            {user && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-full shadow-sm">
                    {getClassIcon(user.character_class)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {user.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {user.character_class} (Lv.{user.level})
                    </span>
                  </div>
                </Link>
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
                href="/quests"
                onClick={(e) => {
                  handleProtectedLink(e, "/quests");
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl font-medium transition ${
                  user
                    ? "hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {user ? <Scroll size={20} /> : <Lock size={20} />}
                เควส
              </Link>

              <Link
                href="/users"
                onClick={(e) => {
                  handleProtectedLink(e, "/users");
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl font-medium transition ${
                  user
                    ? "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {user ? <Users size={20} /> : <Lock size={20} />}
                สมาชิกกิลด์
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
              คู่มือคลาส
            </button>

            {!user && (
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex justify-center w-full py-3 rounded-xl font-bold bg-slate-100  hover:text-indigo-400 dark:hover:text-indigo-400 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex justify-center items-center gap-2 w-full py-3 rounded-xl font-bold bg-indigo-600 text-white"
                >
                  <UserPlus size={18} />
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </>
  );
}
