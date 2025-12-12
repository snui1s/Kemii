"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import UserCard from "@/components/UserCard";
import SynergyModal from "@/components/SynergyModal";
import toast from "react-hot-toast";
import {
  Users,
  Wand,
  Shield,
  Sword,
  Heart,
  Skull,
  User as UserIcon,
} from "lucide-react";
import { Analytics } from "@vercel/analytics/next";
import { useQuery } from "@tanstack/react-query";
import ElementalLoader from "@/components/ElementalLoader";

interface User {
  id: number;
  name: string;
  character_class: string; // เปลี่ยนจาก animal
  level: number; // เพิ่ม level
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  // ดึงข้อมูลผู้ใช้ทั้งหมดมาแสดงในการ์ด
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/users`);
      return res.data;
    },
  });

  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
    null
  );
  // State สำหรับข้อมูลผู้ใช้ปัจจุบัน
  const [myId, setMyId] = useState<number | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [myClass, setMyClass] = useState<string | null>(null); // เก็บอาชีพ
  const [myLevel, setMyLevel] = useState<number>(1); // เก็บเลเวล

  const checkLoginStatus = () => {
    const storedId = localStorage.getItem("myUserId");
    const storedName = localStorage.getItem("myName");
    // ดึงข้อมูล Class และ Level จาก Local Storage
    const storedClass = localStorage.getItem("myClass");
    const storedLevel = localStorage.getItem("myLevel");

    if (storedId && storedId !== "undefined" && storedId !== "null") {
      setMyId(Number(storedId));
      setMyName(storedName);
      setMyClass(storedClass || "Novice"); // ถ้าไม่มีให้เป็น Novice
      setMyLevel(storedLevel ? Number(storedLevel) : 1); // ถ้าไม่มีให้เป็น Lv.1
    } else {
      setMyId(null);
      setMyName(null);
      setMyClass(null);
      setMyLevel(1);
      if (storedId === "undefined") {
        localStorage.removeItem("myUserId");
      }
    }
  };

  useEffect(() => {
    checkLoginStatus();
    window.addEventListener("user-updated", checkLoginStatus);
    return () => {
      window.removeEventListener("user-updated", checkLoginStatus);
    };
  }, []);

  const handleCardClick = (partnerId: number) => {
    if (!myId) {
      toast.error("คุณต้องทำพิธีปลุกพลังก่อน ถึงจะส่องสเตตัสเพื่อนได้! 🔒", {
        id: "auth-error",
      });
      return;
    }
    if (partnerId === myId) {
      toast("นี่คือตัวคุณเองนะ ท่านผู้กล้า", {
        icon: "🛡️",
        id: "self-click",
      });
      return;
    }
    setSelectedPartnerId(partnerId);
  };

  // ฟังก์ชันช่วยเลือกไอคอนตามอาชีพ
  const getClassIcon = (cls: string | null) => {
    switch (cls) {
      case "Mage":
        return <Wand size={40} />;
      case "Paladin":
        return <Shield size={40} />;
      case "Warrior":
        return <Sword size={40} />;
      case "Cleric":
        return <Heart size={40} />;
      case "Rogue":
        return <Skull size={40} />;
      default:
        return <UserIcon size={40} />;
    }
  };

  return (
    <div className="relative h-full w-full max-w-5xl mx-auto mb-12 mt-5 px-4 sm:px-0">
      <div className="relative bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-blue-100/50 to-purple-100/50 dark:from-blue-600/20 dark:to-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none transition-colors duration-500"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-linear-to-tr from-yellow-100/50 to-red-100/50 dark:from-yellow-600/10 dark:to-red-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none transition-colors duration-500"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                Kemii Guild
              </span>{" "}
              <span className="text-slate-700 dark:text-slate-200">
                Assembly
              </span>
            </h1>
            {myId ? (
              <div className="animate-fade-in-up">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-6 mb-6 leading-tight">
                  ยินดีต้อนรับกลับ...
                  <span className="text-blue-600 dark:text-blue-400 mx-2">
                    ลงดันไหม?
                  </span>{" "}
                </h1>

                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                  เตรียมปาร์ตี้ของคุณให้พร้อม แล้วออกไปพิชิต
                  <span className="font-bold text-slate-800 dark:text-white">
                    ดันเจี้ยนแห่งการทำงาน
                  </span>{" "}
                  <br className="hidden sm:block" />
                  ด้วยพลังแห่งความเข้ากันได้!
                </p>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl leading-relaxed animate-fade-in-up">
                เข้าร่วมกิลด์ ค้นหาคลาสของคุณ{" "}
                <br className="hidden md:inline" />
                และสร้างปาร์ตี้ที่แข็งแกร่งที่สุดด้วย{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  AI Analysis
                </span>{" "}
                ⚡
              </p>
            )}
            <div className="mt-6 flex items-center justify-center md:justify-start gap-4">
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/50 border border-transparent dark:border-slate-700 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-sm">
                <Users
                  size={16}
                  className="text-indigo-500 dark:text-indigo-400"
                />{" "}
                สมาชิกกิลด์{" "}
                <span className="text-slate-900 dark:text-white font-bold">
                  {users.length}
                </span>{" "}
                ท่าน
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto flex justify-center">
            {myId ? (
              (() => {
                let theme = {
                  wrapper:
                    "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
                  text: "text-slate-800 dark:text-slate-200",
                  subText: "text-slate-600 dark:text-slate-400",
                  label: "Novice",
                };

                // กำหนดธีมสีตามอาชีพ
                if (myClass === "Mage") {
                  theme = {
                    wrapper:
                      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-500/30",
                    text: "text-purple-800 dark:text-purple-200",
                    subText: "text-purple-600/80 dark:text-purple-300/70",
                    label: "Mage (นักเวทย์)",
                  };
                } else if (myClass === "Warrior") {
                  theme = {
                    wrapper:
                      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30",
                    text: "text-red-800 dark:text-red-200",
                    subText: "text-red-600/80 dark:text-red-300/70",
                    label: "Warrior (นักรบ)",
                  };
                } else if (myClass === "Paladin") {
                  theme = {
                    wrapper:
                      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30",
                    text: "text-yellow-800 dark:text-yellow-200",
                    subText: "text-yellow-600/80 dark:text-yellow-300/70",
                    label: "Paladin (อัศวิน)",
                  };
                } else if (myClass === "Cleric") {
                  theme = {
                    wrapper:
                      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30",
                    text: "text-green-800 dark:text-green-200",
                    subText: "text-green-600/80 dark:text-green-300/70",
                    label: "Cleric (นักบวช)",
                  };
                } else if (myClass === "Rogue") {
                  theme = {
                    wrapper:
                      "bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-500/30",
                    text: "text-slate-800 dark:text-slate-200",
                    subText: "text-slate-600/80 dark:text-slate-300/70",
                    label: "Rogue (โจร)",
                  };
                }

                return (
                  <div
                    className={`${theme.wrapper} backdrop-blur-sm p-6 rounded-2xl border shadow-sm flex flex-col items-center gap-3 w-64 animate-fade-in-up transition-all duration-300`}
                  >
                    <div
                      className={`text-xs font-bold uppercase tracking-widest opacity-70 ${theme.text}`}
                    >
                      Character Status
                    </div>

                    {/* ✅ ไอคอนอาชีพ */}
                    <div className="text-4xl animate-bounce drop-shadow-md mt-1 filter dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] text-slate-800 dark:text-slate-200">
                      {getClassIcon(myClass)}
                    </div>

                    <div className="text-center mb-2">
                      {/* ✅ ชื่อ + เลเวล */}
                      <div
                        className={`font-bold text-lg ${theme.text} flex items-center justify-center gap-2`}
                      >
                        {myName}
                        <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full text-slate-700 dark:text-slate-300">
                          Lv.{myLevel}
                        </span>
                      </div>
                      <div className={`text-xs font-medium ${theme.subText}`}>
                        {theme.label}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        (window.location.href = `/assessment/result/${myId}`)
                      }
                      className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold py-2.5 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm transition hover:shadow-md hover:scale-[1.02] hover:text-indigo-500 active:scale-95"
                    >
                      ดูสเตตัสของฉัน
                    </button>
                  </div>
                );
              })()
            ) : (
              // Card สำหรับคนที่ยังไม่ได้ Login
              <div className="bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 shadow-sm flex flex-col items-center gap-4 w-64 text-center transition-colors">
                <div className="text-4xl animate-pulse filter dark:drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  🛡️
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-lg">
                    ปลุกพลังฮีโร่ในตัวคุณ
                  </h3>
                  <p className="text-xs text-indigo-600/80 dark:text-indigo-300/70 mt-1">
                    ทำพิธีเพื่อค้นหาคลาสและค่าสเตตัสของคุณ
                  </p>
                </div>
                <button
                  onClick={() => (window.location.href = "/assessment")}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition transform hover:-translate-y-1 hover:shadow-indigo-300 dark:hover:shadow-indigo-900/40"
                >
                  เริ่มพิธีปลุกพลัง ➔
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-10 text-zinc-900 dark:text-zinc-200 text-3xl animate-pulse">
          <ElementalLoader />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {users.map((user) => (
            <div key={user.id} onClick={() => handleCardClick(user.id)}>
              {/* หมายเหตุ: ต้องแก้ UserCard ให้รับ props character_class และ level ด้วยในอนาคต */}
              <UserCard
                key={user.id}
                name={user.name}
                animal={user.character_class} // ใช้ class แทน animal ชั่วคราว
                type={`Lv.${user.level}`} // ใช้ level แทน type ชั่วคราว
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

      {users.length === 0 && !isLoading && (
        <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
          ยังไม่มีสมาชิกในกิลด์
        </div>
      )}

      <Analytics />
    </div>
  );
}
