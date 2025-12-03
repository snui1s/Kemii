"use client"; // ต้องมี เพราะมีการเช็ค State และ LocalStorage
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ClipboardList, LogOut, Shuffle, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function Navbar() {
  const router = useRouter();
  const [myData, setMyData] = useState<{ name: string; animal: string } | null>(
    null
  );

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

    // เรียกทันทีตอนโหลด
    checkUser();

    window.addEventListener("user-updated", checkUser);

    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  // ฟังก์ชัน Logout (ล้างข้อมูล)
  const handleLogout = () => {
    // เรียก Toast แบบพิเศษ (ใส่ JSX เข้าไปข้างในได้)
    toast(
      (t) => (
        // 1. ปรับ Container: จัดกึ่งกลาง (items-center) + เพิ่ม padding
        <div className="flex flex-col items-center gap-4 min-w-[260px] py-2">
          {/* 2. ส่วนข้อความ: จัดกลาง (text-center) */}
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-800 flex items-center justify-center gap-2">
              จะหนีไปแล้วเหรอ? <span className="text-2xl">🥺</span>
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              ข้อมูลประวัติในเครื่องจะหายไปนะ
            </p>
          </div>

          {/* 3. ส่วนปุ่ม: ใช้ Grid แบ่ง 2 ช่องเท่ากัน (สวยเป๊ะ) */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
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
          background: "#fff",
          padding: "16px",
          borderRadius: "16px", // เพิ่มความมนให้เข้ากับธีม
          boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.2)", // เงาฟุ้งๆ สวยๆ
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

  return (
    <nav className="bg-slate-100 backdrop-blur-md text-slate-600 p-4  relative top-0 z-50 shadow-sm border-b border-slate-200/50 transition-all">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo ซ้ายมือ */}
        <Link
          href="/"
          className="text-xl font-bold flex items-center gap-2 text-slate-800 hover:text-green-500 transition"
        >
          <Users size={28} />
          <span className="hidden sm:inline">4Elements</span>
        </Link>

        {/* เมนูขวามือ */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-green-500 transition text-sm sm:text-base"
          >
            <Users size={18} />
            <span className="hidden sm:inline">ทีม</span>
          </Link>

          <Link
            href="/build-team"
            className="flex items-center gap-1 hover:text-green-500 transition text-sm sm:text-base"
          >
            <UserPlus size={18} />
            <span className="hidden sm:inline">สร้างทีม</span>
          </Link>

          <Link
            href="/grouping"
            className="flex items-center gap-1 hover:text-green-500 transition text-sm sm:text-base"
          >
            <Shuffle size={18} />
            <span className="hidden sm:inline">จัดทีมด้วย AI</span>
          </Link>

          {myData ? (
            <div className="flex items-center gap-4 pl-4 border-l border-slate-700">
              {/* Profile Badge */}
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <span className="text-xl">{getAnimalEmoji(myData.animal)}</span>
                <span className="font-semibold text-green-400 text-sm max-w-[100px] truncate">
                  {myData.name}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 transition"
                title="ออกจากระบบ"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link
              href="/assessment"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-bold transition shadow-lg shadow-green-900/20"
            >
              <ClipboardList size={18} />
              <span>เริ่มทำแบบประเมิน</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
