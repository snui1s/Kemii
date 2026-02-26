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
import UserCardSkeleton from "@/components/skeletons/UserCardSkeleton";

interface User {
  id: string;
  name: string;
  character_class: string;
  level: number;
  ocean_openness?: number;
  ocean_conscientiousness?: number;
  ocean_extraversion?: number;
  ocean_agreeableness?: number;
  ocean_neuroticism?: number;
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
  
  // Derived state to avoid unnecessary useEffect renders (Next/React Best Practice)
  const hasMissingDept = currentUser?.skills?.length === 0;

  const handleCardClick = (partnerId: string) => {
    if (!currentUser) {
      toast.error("คุณต้องเข้าสู่ระบบก่อน ถึงจะส่องสเตตัสเพื่อนได้! 🔒", {
        id: "auth-error",
      });
      return;
    }
    if (partnerId === currentUser.id) {
      toast("นี่มันตัวคุณเองนี่นา! 🤔");
      return;
    }

    // Find the partner to check if they are a Novice
    const partner = users.find((u) => u.id === partnerId);
    if (partner?.character_class === "Novice") {
      toast.error("คนนี้ยังไม่ได้ปลุกพลังเลย เทียบไม่ได้นะจ้ะน้อง", {
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
    <div className="relative h-full w-full max-w-5xl mx-auto mb-8 sm:mb-12 pt-6 sm:pt-10 px-4 sm:px-6">
      <div className="relative mb-12 sm:mb-20 pt-8 sm:pt-16 pb-8 animate-fade-in-up">
        {hasMissingDept && (
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 rounded-full bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 hover:-translate-y-0.5 transition-transform border border-red-200 dark:border-red-900/50 backdrop-blur-md"
            onClick={() => router.push("/profile")}
          >
            <AlertTriangle size={16} />
            <span>กรุณาเลือกสังกัด (Department) ที่หน้าโปรไฟล์ของท่าน</span>
          </div>
        )}

        {/* Editorial Asymmetric Layout */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 lg:gap-16 w-full">
          {/* Left Side: Typography & Copy */}
          <div className="space-y-6 text-left max-w-2xl">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-[-0.02em] text-[var(--foreground)] opacity-90 leading-none">
              Kemii<span className="text-[var(--highlight)]">.</span>
            </h1>

            {currentUser?.id ? (
              <p className="text-lg sm:text-xl text-[var(--muted)] font-medium leading-relaxed max-w-lg">
                ยินดีต้อนรับ, <span className="font-semibold text-[var(--foreground)]">{currentUser.name}</span>
                <br className="hidden sm:block" />
                หาเคมีที่ลงตัวด้วยความ <span className="font-semibold text-[var(--highlight)] italic">"</span><span className="font-semibold decoration text-[var(--foreground)]">Minimal</span><span className="font-semibold text-[var(--highlight)] italic">"</span>
              </p>
            ) : (
               <p className="text-lg sm:text-xl text-[var(--muted)] font-medium leading-relaxed max-w-lg">
                พื้นที่สำหรับการทำงานร่วมกันอย่างลงตัว
                <br />
                ค้นหาเพื่อนร่วมทีมที่ใช่ด้วย <span className="font-semibold text-[var(--foreground)]">Kemii Golden Formula</span>
              </p>
            )}
            
            <div className="pt-2">
              <span className="text-sm font-mono text-[var(--muted)] flex items-center gap-2 opacity-80 border-b border-black/5 dark:border-white/5 pb-2 inline-flex">
                <Users size={14} />
                Guild Members: <span className="text-[var(--foreground)] font-semibold">{totalInDb}</span>
              </span>
            </div>
          </div>

          {/* Right Side: Actions & Profile Indicator */}
          <div className="shrink-0 flex flex-col items-start lg:items-end space-y-4 pt-4 lg:pt-0">
            {currentUser?.id ? (
              <>
                {currentUser.character_class === "Novice" ? (
                  <button
                     onClick={() => router.push("/assessment")}
                     className="px-8 py-3.5 rounded-full border-2 border-[var(--highlight)] text-[var(--highlight)] hover:bg-[var(--highlight)] hover:text-white transition-all text-sm tracking-widest font-bold uppercase hover:shadow-lg hover:shadow-[var(--highlight)]/20"
                  >
                    เริ่มค้นหาตัวตน
                  </button>
                ) : (
                  <div className="flex flex-col items-start lg:items-end gap-3">
                     <span className="text-[10px] text-[var(--muted)] uppercase tracking-[0.2em] font-bold">Your Status</span>
                     <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-white/5 group relative overflow-hidden backdrop-blur-md transition-all hover:border-black/10 dark:hover:border-white/20">
                       <div className="relative z-10 p-2 bg-black/5 dark:bg-white/5 rounded-xl">
                         {getClassIcon(currentUser.character_class)}
                       </div>
                       <div className="text-left relative z-10 w-24">
                          <div className="text-base font-bold text-[var(--foreground)] tracking-tight">{currentUser.character_class}</div>
                          <div className="text-xs font-mono text-[var(--muted)] font-medium">Lvl {currentUser.level}</div>
                       </div>
                     </div>
                     <Link href={`/assessment/result/${currentUser.id}`} className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors underline-offset-4 hover:underline mt-1">
                       ดูสเตตัสของคุณ →
                     </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                 <Link href="/login" className="w-full sm:w-auto px-10 py-3.5 rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-all text-sm font-bold uppercase tracking-wider text-center shadow-lg">
                   เข้าสู่ระบบ
                 </Link>
                 <Link href="/register" className="w-full sm:w-auto px-10 py-3.5 rounded-full border border-black/10 dark:border-white/10 text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-wider text-center">
                   สมัครสมาชิก
                 </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && users.length === 0 ? (
        <div className="grid grid-cols-1 min-[450px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <UserCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 min-[450px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {users.map((user: User, i: number) => {
              const aggregatedScores = user.ocean_scores || {
                Openness: user.ocean_openness || 0,
                Conscientiousness: user.ocean_conscientiousness || 0,
                Extraversion: user.ocean_extraversion || 0,
                Agreeableness: user.ocean_agreeableness || 0,
                Neuroticism: user.ocean_neuroticism || 0,
              };

              return (
                <div
                  key={user.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i % 12 * 50}ms` }}
                >
                  <UserCard
                    id={user.id}
                    name={user.name}
                    characterClass={user.character_class}
                    type={`Lv.${user.level}`}
                    scores={aggregatedScores}
                    compactMode={true}
                    isOwnCard={user.id === currentUser?.id}
                    onInspect={() => handleCardClick(user.id)}
                  />
                </div>
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
