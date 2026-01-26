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
      <div className="relative mb-12 py-10 text-center animate-fade-in-up">
        {hasMissingDept && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium cursor-pointer hover:bg-[var(--highlight)]/10 hover:text-[var(--highlight)] hover:border-[var(--highlight)]/20 transition-colors border border-red-100 dark:border-red-900/50"
            onClick={() => router.push("/profile")}
          >
            <AlertTriangle size={14} />
            <span>กรุณาเลือกสังกัด (Department) ที่หน้าโปรไฟล์</span>
          </div>
        )}

        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[var(--foreground)]">
            Kemii{" "}
            <span style={{ color: "var(--highlight)" }} className="font-semibold">
              Guild
            </span>
          </h1>

          {currentUser?.id ? (
            <div className="max-w-xl mx-auto space-y-4">
              <p className="text-lg text-[var(--muted)] font-medium leading-relaxed">
                ยินดีต้อนรับ, <span className="font-medium">{currentUser.name}</span>
                <br />
                หาเคมีที่ลงตัวด้วยความ <span className="font-semibold text-[var(--highlight)]">"</span><span className="font-semibold decoration">Minimal</span><span className="font-semibold text-[var(--highlight)]">"</span>
              </p>
              
              <div className="flex justify-center pt-4">
                {currentUser.character_class === "Novice" ? (
                  <button
                     onClick={() => router.push("/assessment")}
                     className="px-8 py-2.5 rounded-full border border-[var(--highlight)] text-[var(--highlight)] hover:bg-[var(--highlight)] hover:text-white transition-all text-sm tracking-wide font-medium"
                  >
                    เริ่มค้นหาตัวตน
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                     <span className="text-xs text-[var(--muted)] uppercase tracking-widest">Character Class</span>
                     <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-sm">
                       {getClassIcon(currentUser.character_class)}
                       <div className="text-left">
                          <div className="text-sm font-semibold">{currentUser.character_class}</div>
                          <div className="text-xs text-[var(--muted)]">Lv.{currentUser.level}</div>
                       </div>
                     </div>
                     <Link href={`/assessment/result/${currentUser.id}`} className="text-xs text-[var(--muted)] hover:text-[var(--highlight)] transition-colors mt-2">
                       ดูสเตตัสของคุณ
                     </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
               <p className="text-lg text-[var(--muted)] font-medium">
                พื้นที่สำหรับการทำงานร่วมกันอย่างลงตัว
                <br className="hidden sm:block" />
                ค้นหาเพื่อนร่วมทีมที่ใช่ด้วย <span className="font-medium text-[var(--highlight)]">AI Analysis</span>
              </p>
              <div className="flex justify-center gap-4">
                 <Link href="/login" className="px-8 py-2.5 rounded-full bg-[var(--highlight)] text-white hover:opacity-90 hover:shadow-[0_0_15px_rgba(250,129,18,0.4)] transition-all text-sm font-medium">
                   เข้าสู่ระบบ
                 </Link>
                 <Link href="/register" className="px-8 py-2.5 rounded-full border border-[var(--highlight)] text-[var(--highlight)] hover:bg-[var(--highlight)] hover:text-white hover:shadow-[0_0_15px_rgba(250,129,18,0.2)] transition-all text-sm font-medium">
                   สมัครสมาชิก
                 </Link>
              </div>
            </div>
          )}
          
          <div className="pt-8">
            <span className="text-sm font-mono text-[var(--muted)] flex items-center justify-center gap-2 opacity-80">
              <Users size={12} />
              Guild Members: {totalInDb}
            </span>
          </div>
        </div>
      </div>

      {isLoading && users.length === 0 ? (
        <div className="flex justify-center p-10">
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
            <div className="mt-12 flex justify-center pb-12">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-8 py-3 rounded-full border border-[var(--highlight)] text-[var(--highlight)] hover:bg-[var(--highlight)] hover:text-white hover:shadow-[0_0_20px_rgba(250,129,18,0.3)] transition-all duration-300 disabled:opacity-50 text-sm font-medium flex items-center gap-2 group"
              >
                {isFetchingNextPage ? (
                  <>
                    <div className="w-3 h-3 border border-[var(--background)] border-t-transparent rounded-full animate-spin"></div>
                    กำลังเรียก...
                  </>
                ) : (
                  <>
                    <Users size={16} className="group-hover:scale-110 transition-transform" />
                    โหลดเพิ่มเติม
                  </>
                )}
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
        <div className="text-center text-[var(--muted)] mt-10 opacity-60 font-light">
          — ยังไม่มีสมาชิกในกิลด์ —
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
        <div className="flex justify-center p-12">
          <ElementalLoader />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
