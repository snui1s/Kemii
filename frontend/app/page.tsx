"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import UserCard from "@/components/UserCard";
import SynergyModal from "@/components/SynergyModal"; // 1. นำเข้า
import InfoModal from "@/components/InfoModal";
import toast from "react-hot-toast";
import { Users, HelpCircle } from "lucide-react";

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

      // หาตำแหน่งขอบบนของ Footer เทียบกับหน้าจอ
      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // ถ้าขอบบนของ Footer เริ่มโผล่เข้ามาในจอ (ค่าน้อยกว่าความสูงจอ)
      if (footerRect.top < windowHeight) {
        // คำนวณส่วนต่างว่า Footer กินที่เข้ามาเท่าไหร่
        const overlap = windowHeight - footerRect.top;
        // ดันปุ่มขึ้น = ระยะปกติ (24) + ส่วนที่ Footer กินเข้ามา + เผื่อช่องว่างนิดหน่อย (10)
        setButtonBottom(24 + overlap + 10);
      } else {
        // ถ้า Footer ยังไม่มา ให้กลับไปที่เดิม
        setButtonBottom(24);
      }
    };

    // ติดตั้งตัวดักจับ
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll); // กันเหนียวเผื่อย่อขยายจอ

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
    <div className="relative h-full w-full max-w-5xl mx-auto mb-12 mt-5">
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
                const animal = typeof window !== "undefined" ? myAnimal : "";
                const name = typeof window !== "undefined" ? myName : "";

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
                    icon: "🐂",
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

      {/* --- ✨ ส่วนที่เพิ่ม: Modal --- */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
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
      <button
        onClick={() => setShowInfo(true)}
        // ใช้ style เพื่อกำหนดตำแหน่ง bottom แบบ Real-time
        style={{ bottom: `${buttonBottom}px` }}
        className="fixed right-6 z-40 bg-white text-slate-500 hover:text-blue-600 p-3 rounded-full shadow-lg border border-slate-200 hover:border-blue-200 hover:shadow-xl transition-all duration-75 group"
        // *หมายเหตุ: ใช้ duration-75 หรือไม่ต้องใส่ เพื่อให้มันขยับตามนิ้วทันทีไม่หน่วง
        title="เกี่ยวกับระบบ"
      >
        <HelpCircle
          size={28}
          className="group-hover:scale-110 transition-transform"
        />
      </button>
    </div>
  );
}
