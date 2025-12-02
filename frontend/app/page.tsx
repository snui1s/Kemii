"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import UserCard from "@/components/UserCard";
import SynergyModal from "@/components/SynergyModal"; // 1. นำเข้า
import toast from "react-hot-toast";
import { Users } from "lucide-react";

interface User {
  id: number;
  name: string;
  animal: string;
  dominant_type: string;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
    null
  );
  const [myId, setMyId] = useState<number | null>(null);
  const [myAnimal, setMyAnimal] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);

  const checkLoginStatus = () => {
    const storedId = localStorage.getItem("myUserId");
    const storedAnimal = localStorage.getItem("myAnimal");
    const storedName = localStorage.getItem("myName");

    if (storedId) {
      setMyId(Number(storedId));
      setMyAnimal(storedAnimal);
      setMyName(storedName);
    } else {
      setMyId(null);
      setMyAnimal(null);
      setMyName(null);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:8000/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        alert("เชื่อมต่อ Backend ไม่ได้!");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
    const storedId = localStorage.getItem("myUserId");
    if (storedId) setMyId(Number(storedId));

    checkLoginStatus();

    window.addEventListener("user-updated", checkLoginStatus);

    // Cleanup
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
    setSelectedPartnerId(partnerId); // เปิด Modal
  };

  return (
    <div className="h-full w-full max-w-5xl mx-auto mb-12 mt-5">
      {/* --- NEW DASHBOARD BANNER --- */}
      <div className="relative bg-white rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 overflow-hidden">
        {/* Background Decorative Blobs (ตกแต่งพื้นหลังให้ดูมีมิติ) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-blue-100/50 to-purple-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-linear-to-tr from-yellow-100/50 to-red-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          {/* ฝั่งซ้าย: ข้อความต้อนรับ */}
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-2">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600">
                4Elements
              </span>{" "}
              Team
            </h1>
            <p className="text-slate-500 text-lg max-w-xl">
              สำรวจจักรวาลของทีม ค้นหาเคมีที่ลงตัว{" "}
              <br className="hidden md:inline" />
              และปลดล็อกศักยภาพสูงสุดด้วย{" "}
              <span className="font-bold text-indigo-600">AI Analysis</span> ⚡
            </p>

            <div className="mt-6 flex items-center justify-center md:justify-start gap-4">
              {/* Stat Badge */}
              <div className="px-4 py-1.5 bg-slate-100 rounded-full text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Users size={16} /> สมาชิกทั้งหมด{" "}
                <span className="text-slate-900">{users.length}</span> คน
              </div>
            </div>
          </div>

          {/* ฝั่งขวา: Action Card (Update สีตามธาตุ) */}
          <div className="shrink-0">
            {myId ? (
              (() => {
                // 1. ดึงค่าจาก LocalStorage มารอไว้
                const animal =
                  typeof window !== "undefined"
                    ? localStorage.getItem("myAnimal")
                    : "";
                const name =
                  typeof window !== "undefined"
                    ? localStorage.getItem("myName")
                    : "";

                // 2. กำหนดธีมสีและชื่อใหม่ตามสัตว์
                let theme = {
                  bg: "bg-slate-50",
                  border: "border-slate-200",
                  text: "text-slate-800",
                  icon: "👤",
                  label: "Unknown",
                };

                if (animal?.includes("กระทิง")) {
                  theme = {
                    bg: "bg-red-50",
                    border: "border-red-200",
                    text: "text-red-800",
                    icon: "🔥",
                    label: "Dominance (ผู้นำ)",
                  };
                } else if (animal?.includes("อินทรี")) {
                  theme = {
                    bg: "bg-yellow-50",
                    border: "border-yellow-200",
                    text: "text-yellow-800",
                    icon: "🦅",
                    label: "Influence (นักสร้างสรรค์)",
                  };
                } else if (animal?.includes("หนู")) {
                  theme = {
                    bg: "bg-green-50",
                    border: "border-green-200",
                    text: "text-green-800",
                    icon: "🐁",
                    label: "Steadiness (ผู้สนับสนุน)",
                  };
                } else if (animal?.includes("หมี")) {
                  theme = {
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    text: "text-blue-800",
                    icon: "🐻",
                    label: "Compliance (นักวิเคราะห์)",
                  };
                }

                return (
                  <div
                    className={`${theme.bg} backdrop-blur-sm p-6 rounded-2xl border ${theme.border} shadow-sm flex flex-col items-center gap-3 w-64 animate-fade-in-up`}
                  >
                    <div
                      className={`text-xs font-bold uppercase tracking-widest opacity-70 ${theme.text}`}
                    >
                      Welcome Back
                    </div>

                    {/* ไอคอนเด้งดึ๋ง */}
                    <div className="text-4xl animate-bounce drop-shadow-sm mt-1">
                      {theme.icon}
                    </div>

                    <div className="text-center mb-2">
                      <div className={`font-bold text-lg ${theme.text}`}>
                        {name}
                      </div>
                      {/* เปลี่ยนชื่อสัตว์ เป็น Label ภาษาอังกฤษเท่ๆ */}
                      <div
                        className={`text-xs font-medium opacity-80 ${theme.text}`}
                      >
                        {theme.label}
                      </div>
                    </div>

                    <button
                      onClick={() => (window.location.href = `/result/${myId}`)}
                      className="w-full bg-white hover:bg-white/80 text-slate-700 text-sm font-bold py-2.5 rounded-xl border border-slate-100 shadow-sm transition hover:shadow-md"
                    >
                      ดูผลวิเคราะห์ของฉัน
                    </button>
                  </div>
                );
              })()
            ) : (
              // Case 2: ถ้ายังไม่ Login (เหมือนเดิม)
              <div className="bg-indigo-50/80 backdrop-blur-sm p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col items-center gap-4 w-64 text-center">
                <div className="text-4xl animate-pulse">🔮</div>
                <div>
                  <h3 className="font-bold text-indigo-900 text-lg">
                    คุณคือธาตุอะไร?
                  </h3>
                  <p className="text-xs text-indigo-600/80 mt-1">
                    ทำแบบประเมินเพื่อค้นหาตัวตนและเปรียบเทียบกับเพื่อน
                  </p>
                </div>
                <button
                  onClick={() => (window.location.href = "/assessment")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition transform hover:-translate-y-1"
                >
                  เริ่มค้นหาตัวตน ➔
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10 text-zinc-900 text-3xl">
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
        <div className="text-center text-gray-400 mt-10">
          ยังไม่มีสมาชิกในทีม
        </div>
      )}
    </div>
  );
}
