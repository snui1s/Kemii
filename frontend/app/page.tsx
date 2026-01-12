"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
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
  AlertTriangle,
} from "lucide-react";
import { Analytics } from "@vercel/analytics/next";
import { useInfiniteQuery } from "@tanstack/react-query";
import ElementalLoader from "@/components/ElementalLoader";

// ✅ 1. อัปเดต Interface ให้ตรงกับ Database จริง (รับค่าแบบแยกฟิลด์)
interface User {
  id: string;
  name: string;
  character_class: string;
  level: number;
  // รับค่าแบบ Flat (ตามที่ Backend ส่งมา)
  ocean_openness?: number;
  ocean_conscientiousness?: number;
  ocean_extraversion?: number;
  ocean_agreeableness?: number;
  ocean_neuroticism?: number;
  // เผื่อไว้กรณี Backend บางตัวส่งมาเป็น Object
  ocean_scores?: { [key: string]: number };
}

import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

function HomeContent() {
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["users", "paginated"],
      queryFn: async ({ pageParam = 0 }) => {
        const res = await api.get("/users", {
          params: { offset: pageParam, limit: 12 },
        });
        return res.data;
      },
      getNextPageParam: (
        lastPage: { users: User[]; total: number },
        allPages: any[]
      ) => {
        const loadedCount = allPages.reduce(
          (sum, page) => sum + page.users.length,
          0
        );
        return loadedCount < lastPage.total ? loadedCount : undefined;
      },
      initialPageParam: 0,
    });

  const users = data?.pages.flatMap((page) => page.users) || [];
  const totalInDb = data?.pages[0]?.total || 0;

  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null
  );
  const [hasMissingDept, setHasMissingDept] = useState(false);

  // Check for missing departments
  useEffect(() => {
    if (currentUser?.skills?.length === 0) {
      setHasMissingDept(true); // Simplified check
    } else {
      setHasMissingDept(false);
    }
  }, [currentUser]);

  const handleCardClick = (partnerId: string) => {
    if (!currentUser) {
      toast.error("คุณต้องเข้าสู่ระบบก่อน ถึงจะส่องสเตตัสเพื่อนได้! 🔒", {
        id: "auth-error",
      });
      return;
    }
    if (partnerId === currentUser.id) {
      toast("นี่มันตัวคุณเองนี่นา! 🤔", { icon: "🪞" });
      return;
    }

    // Find the partner to check if they are a Novice
    const partner = users.find((u) => u.id === partnerId);
    if (partner?.character_class === "Novice") {
      toast.error("คนนี้ยังไม่ได้ปลุกพลังเลย เทียบไม่ได้น้าา", {
        icon: "✨",
        style: {
          borderRadius: "12px",
          background: "#334155",
          color: "#fff",
        },
      });
      return;
    }

    setSelectedPartnerId(partnerId);
  };

  const getClassIcon = (cls: string | null) => {
    switch (cls) {
      case "Mage":
        return <Wand size={40} color="purple" />;
      case "Paladin":
        return <Shield size={40} color="#f59e0b" />;
      case "Warrior":
        return <Sword size={40} color="red" />;
      case "Cleric":
        return <Heart size={40} color="green" />;
      case "Rogue":
        return <Skull size={40} color="blue" />;
      default:
        return <UserIcon size={40} color="gray" />;
    }
  };

  return (
    <div className="relative h-full w-full max-w-5xl mx-auto mb-12 mt-5 px-4 sm:px-0">
      {/* Header Section (Hero Banner) ... lines 102-256 ... */}
      <div className="relative bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-500">
        {hasMissingDept && (
          <div
            className="absolute top-0 left-0 w-full bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 z-50 text-sm font-bold animate-pulse cursor-pointer"
            onClick={() => router.push("/profile")}
          >
            <AlertTriangle size={16} className="text-white" />
            <span>
              คุณยังไม่ได้เลือกสังกัด (Department)!
              คลิกที่นี่เพื่อไปตั้งค่าที่หน้าโปรไฟล์ก่อนเริ่มใช้งาน
            </span>
          </div>
        )}

        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/50 to-purple-100/50 dark:from-blue-600/20 dark:to-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-100/50 to-red-100/50 dark:from-yellow-600/10 dark:to-red-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                Kemii
              </span>{" "}
              <span className="text-slate-700 dark:text-slate-200">
                Guild Assembly
              </span>
            </h1>

            {currentUser?.id ? (
              <div className="animate-fade-in-up">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-6 mb-6 leading-tight">
                  ยินดีต้อนรับกลับ...{" "}
                  <span className="text-blue-600 dark:text-blue-400 mx-2">
                    ลงดันไหม?
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                  เตรียมปาร์ตี้ของคุณให้พร้อม แล้วออกไปพิชิต{" "}
                  <span className="font-bold text-slate-800 dark:text-white">
                    ดันเจี้ยนแห่งการทำงาน
                  </span>{" "}
                  <br className="hidden sm:block" /> ด้วยพลังแห่งความเข้ากันได้!
                </p>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl leading-relaxed animate-fade-in-up">
                เข้าร่วมกิลด์ ค้นหาคลาสของคุณ{" "}
                <br className="hidden md:inline" />{" "}
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
                สมาชิกกิลด์ทั้งหมด{" "}
                <span className="text-slate-900 dark:text-white font-bold">
                  {totalInDb}
                </span>{" "}
                ท่าน
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto flex justify-center">
            {currentUser ? (
              currentUser.character_class === "Novice" ? (
                <div className="bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 shadow-sm flex flex-col items-center gap-4 w-64 text-center transition-colors animate-pulse-slow">
                  <div className="text-4xl animate-bounce text-indigo-600 dark:text-indigo-400">
                    🔮
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-lg">
                      ค้นหาตัวตนของคุณ
                    </h3>
                    <p className="text-xs text-indigo-600/80 dark:text-indigo-300/70 mt-1">
                      คุณยังไม่ได้ทำแบบทดสอบเพื่อค้นหาอาชีพ
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/assessment")}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 rounded-xl shadow-lg transition transform hover:-translate-y-1 active:scale-95"
                  >
                    เริ่มทำพิธีปลุกพลัง ➔
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center gap-3 w-64 animate-fade-in-up">
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70 text-slate-800 dark:text-slate-200">
                    Character Status
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-4 rounded-full shadow-inner mt-2">
                    {getClassIcon(currentUser.character_class)}
                  </div>
                  <div className="text-center mb-2">
                    <div className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
                      {currentUser.name}{" "}
                      <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full text-slate-700 dark:text-slate-300">
                        Lv.{currentUser.level}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {currentUser.character_class}
                    </div>
                  </div>
                  <Link
                    href={`/assessment/result/${currentUser.id}`}
                    className="w-full text-center bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold py-2.5 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm hover:text-indigo-500 transition"
                  >
                    ดูผลการทดสอบของคุณ
                  </Link>
                </div>
              )
            ) : (
              <div className="bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 shadow-sm flex flex-col items-center gap-4 w-64 text-center transition-colors">
                <div className="text-4xl animate-pulse text-indigo-600 dark:text-indigo-400">
                  🛡️
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-lg">
                    เข้าร่วมกิลด์
                  </h3>
                  <p className="text-xs text-indigo-600/80 dark:text-indigo-300/70 mt-1">
                    เข้าสู่ระบบเพื่อค้นหาปาร์ตี้ของคุณ
                  </p>
                </div>
                <div className="w-full flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg transition transform hover:-translate-y-1 block"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/register"
                    className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800 transition block"
                  >
                    สมัครสมาชิก
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && users.length === 0 ? (
        <div className="text-center p-10 text-zinc-900 dark:text-zinc-200 text-3xl animate-pulse">
          <ElementalLoader />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 min-[450px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {users.map((user: User) => {
              const aggregatedScores = user.ocean_scores || {
                Openness: user.ocean_openness || 0,
                Conscientiousness: user.ocean_conscientiousness || 0,
                Extraversion: user.ocean_extraversion || 0,
                Agreeableness: user.ocean_agreeableness || 0,
                Neuroticism: user.ocean_neuroticism || 0,
              };

              return (
                <UserCard
                  key={user.id}
                  id={user.id}
                  name={user.name}
                  characterClass={user.character_class}
                  type={`Lv.${user.level}`}
                  scores={aggregatedScores}
                  compactMode={true}
                  isOwnCard={user.id === currentUser?.id}
                  onInspect={() => handleCardClick(user.id)}
                />
              );
            })}
          </div>

          {hasNextPage && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="group relative px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                  {isFetchingNextPage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      กำลังเรียกพวก...
                    </>
                  ) : (
                    <>
                      <Users size={18} className="text-indigo-500" />
                      เรียกพวกเพิ่ม (Load More)
                    </>
                  )}
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {selectedPartnerId && currentUser && (
        <SynergyModal
          myId={currentUser.id}
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

import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="text-center p-10 text-zinc-900 dark:text-zinc-200 text-3xl animate-pulse">
          <ElementalLoader />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
