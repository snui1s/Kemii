"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import UserCard from "@/components/UserCard";
import SynergyModal from "@/components/SynergyModal";
import InfoModal from "@/components/InfoModal";
import toast from "react-hot-toast";
import { Users, HelpCircle } from "lucide-react";
import { Analytics } from "@vercel/analytics/next";

interface User {
  id: number;
  name: string;
  animal: string;
  dominant_type: string;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
    null
  );
  const [myId, setMyId] = useState<number | null>(null);
  const [myAnimal, setMyAnimal] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [buttonBottom, setButtonBottom] = useState(24);

  const checkLoginStatus = () => {
    const storedId = localStorage.getItem("myUserId");
    const storedAnimal = localStorage.getItem("myAnimal");
    const storedName = localStorage.getItem("myName");

    if (storedId && storedId !== "undefined" && storedId !== "null") {
      setMyId(Number(storedId));
      setMyAnimal(storedAnimal);
      setMyName(storedName);
    } else {
      setMyId(null);
      setMyAnimal(null);
      setMyName(null);
      if (storedId === "undefined") {
        localStorage.removeItem("myUserId");
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.getElementById("site-footer");
      if (!footer) return;
      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (footerRect.top < windowHeight) {
        const overlap = windowHeight - footerRect.top;
        setButtonBottom(24 + overlap + 10);
      } else {
        setButtonBottom(24);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/users`);
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        toast.error("เชื่อมต่อระบบไม่ได้ ลองใหม่นะ 🥺");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
    const storedId = localStorage.getItem("myUserId");
    if (storedId) setMyId(Number(storedId));

    checkLoginStatus();

    window.addEventListener("user-updated", checkLoginStatus);

    return () => {
      window.removeEventListener("user-updated", checkLoginStatus);
    };
  }, []);

  const handleCardClick = (partnerId: number) => {
    if (!myId) {
      toast.error("คุณต้องทำแบบประเมินก่อน ถึงจะส่องเคมีกับเพื่อนได้! 🔒");
      return;
    }
    if (partnerId === myId) {
      toast("นี่คือตัวคุณเองนะ", { icon: "🤞" });
      return;
    }
    setSelectedPartnerId(partnerId);
  };

  return (
    <div className="relative h-full w-full max-w-5xl mx-auto mb-12 mt-5 px-4 sm:px-0">
      {/* --- ✨ HERO BANNER (RE-DESIGNED FOR DARK MODE) --- */}
      <div className="relative bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-500">
        {/* 🎨 Background Decorative Blobs (ปรับสีใหม่ให้โกลว์ในโหมดมืด) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-blue-100/50 to-purple-100/50 dark:from-blue-600/20 dark:to-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none transition-colors duration-500"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-linear-to-tr from-yellow-100/50 to-red-100/50 dark:from-yellow-600/10 dark:to-red-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none transition-colors duration-500"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          {/* ฝั่งซ้าย: ข้อความต้อนรับ */}
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                Kemii
              </span>{" "}
              <span className="text-slate-700 dark:text-slate-200">
                Team Chemistry
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl leading-relaxed">
              สำรวจจักรวาลของทีม ค้นหาเคมีที่ลงตัว{" "}
              <br className="hidden md:inline" />
              และปลดล็อกศักยภาพสูงสุดด้วย{" "}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                AI Analysis
              </span>{" "}
              ⚡
            </p>

            <div className="mt-6 flex items-center justify-center md:justify-start gap-4">
              {/* Stat Badge */}
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/50 border border-transparent dark:border-slate-700 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-sm">
                <Users
                  size={16}
                  className="text-indigo-500 dark:text-indigo-400"
                />{" "}
                สมาชิกทั้งหมด{" "}
                <span className="text-slate-900 dark:text-white font-bold">
                  {users.length}
                </span>{" "}
                คน
              </div>
            </div>
          </div>

          {/* ฝั่งขวา: Action Card (Update สีตามธาตุ + Dark Mode) */}
          <div className="shrink-0 w-full md:w-auto flex justify-center">
            {myId ? (
              (() => {
                const animal = typeof window !== "undefined" ? myAnimal : "";
                const name = typeof window !== "undefined" ? myName : "";

                // 2. 🎨 กำหนดธีมสี (แยก Dark Mode ชัดเจน)
                let theme = {
                  // Default
                  wrapper:
                    "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
                  text: "text-slate-800 dark:text-slate-200",
                  subText: "text-slate-600 dark:text-slate-400",
                  icon: "👤",
                  label: "Unknown",
                };

                if (animal?.includes("กระทิง")) {
                  theme = {
                    wrapper:
                      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30",
                    text: "text-red-800 dark:text-red-200",
                    subText: "text-red-600/80 dark:text-red-300/70",
                    icon: "🐂",
                    label: "Dominance (ผู้นำ)",
                  };
                } else if (animal?.includes("อินทรี")) {
                  theme = {
                    wrapper:
                      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30",
                    text: "text-yellow-800 dark:text-yellow-200",
                    subText: "text-yellow-600/80 dark:text-yellow-300/70",
                    icon: "🦅",
                    label: "Influence (นักสร้างสรรค์)",
                  };
                } else if (animal?.includes("หนู")) {
                  theme = {
                    wrapper:
                      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30",
                    text: "text-green-800 dark:text-green-200",
                    subText: "text-green-600/80 dark:text-green-300/70",
                    icon: "🐁",
                    label: "Steadiness (ผู้สนับสนุน)",
                  };
                } else if (animal?.includes("หมี")) {
                  theme = {
                    wrapper:
                      "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30",
                    text: "text-blue-800 dark:text-blue-200",
                    subText: "text-blue-600/80 dark:text-blue-300/70",
                    icon: "🐻",
                    label: "Compliance (นักวิเคราะห์)",
                  };
                }

                return (
                  <div
                    className={`${theme.wrapper} backdrop-blur-sm p-6 rounded-2xl border shadow-sm flex flex-col items-center gap-3 w-64 animate-fade-in-up transition-all duration-300`}
                  >
                    <div
                      className={`text-xs font-bold uppercase tracking-widest opacity-70 ${theme.text}`}
                    >
                      Welcome Back
                    </div>

                    <div className="text-4xl animate-bounce drop-shadow-md mt-1 filter dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                      {theme.icon}
                    </div>

                    <div className="text-center mb-2">
                      <div className={`font-bold text-lg ${theme.text}`}>
                        {name}
                      </div>
                      <div className={`text-xs font-medium ${theme.subText}`}>
                        {theme.label}
                      </div>
                    </div>

                    <button
                      onClick={() => (window.location.href = `/result/${myId}`)}
                      className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold py-2.5 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm transition hover:shadow-md hover:scale-[1.02] active:scale-95"
                    >
                      ดูผลวิเคราะห์ของฉัน
                    </button>
                  </div>
                );
              })()
            ) : (
              // Case 2: ถ้ายังไม่ Login (Dark Mode Ready)
              <div className="bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 shadow-sm flex flex-col items-center gap-4 w-64 text-center transition-colors">
                <div className="text-4xl animate-pulse filter dark:drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  🔮
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-lg">
                    คุณคือธาตุอะไร?
                  </h3>
                  <p className="text-xs text-indigo-600/80 dark:text-indigo-300/70 mt-1">
                    ทำแบบประเมินเพื่อค้นหาตัวตนและเปรียบเทียบกับเพื่อน
                  </p>
                </div>
                <button
                  onClick={() => (window.location.href = "/assessment")}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition transform hover:-translate-y-1 hover:shadow-indigo-300 dark:hover:shadow-indigo-900/40"
                >
                  เริ่มค้นหาตัวตน ➔
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Rest of the Content --- */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      {loading ? (
        <div className="text-center p-10 text-zinc-900 dark:text-zinc-200 text-3xl animate-pulse">
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div key={user.id} onClick={() => handleCardClick(user.id)}>
              <UserCard
                key={user.id}
                name={user.name}
                animal={user.animal}
                type={user.dominant_type}
              />
            </div>
          ))}
        </div>
      )}

      {selectedPartnerId && myId && (
        <SynergyModal
          myId={myId}
          partnerId={selectedPartnerId}
          onClose={() => setSelectedPartnerId(null)}
        />
      )}

      {users.length === 0 && !loading && (
        <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
          ยังไม่มีสมาชิกในทีม
        </div>
      )}

      <button
        onClick={() => setShowInfo(true)}
        style={{ bottom: `${buttonBottom}px` }}
        className="fixed right-6 z-40 bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 p-3 rounded-full shadow-lg border border-slate-200 hover:border-blue-200 hover:shadow-xl transition-all duration-75 group"
        title="เกี่ยวกับระบบ"
      >
        <HelpCircle
          size={28}
          className="group-hover:scale-110 transition-transform"
        />
      </button>
      <Analytics />
    </div>
  );
}
