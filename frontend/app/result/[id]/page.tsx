"use client"; // 👈 สำคัญ: ต้องเป็น Client Component เพื่อเช็ค LocalStorage

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ResultClient from "@/components/ResultClient";
import { notFound } from "next/navigation";
import toast from "react-hot-toast";
import ElementalLoader from "@/components/ElementalLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useQuery } from "@tanstack/react-query";

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["analysis", params?.id],
    queryFn: async () => {
      const token = localStorage.getItem("myToken");
      if (!token) {
        throw new Error("No token");
      }
      const res = await fetch(`${API_URL}/users/${params?.id}/analysis`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error("403");
        throw new Error("Failed to fetch");
      }
      return res.json();
    },
    enabled: !!params?.id,
    retry: false,
  });

  useEffect(() => {
    const myId = localStorage.getItem("myUserId");
    const token = localStorage.getItem("myToken");

    if (!token) {
      toast.error("ไม่พบข้อมูลยืนยันตัวตน");
      router.push("/");
      return;
    }

    if (params?.id && myId && myId !== params.id) {
      toast.error("ไม่สามารถดูข้อมูลของคนอื่นได้ครับ", {
        id: "security-guard",
      });
      router.replace("/");
    } else if (myId === params?.id) {
      setIsAuthorized(true);
    }
  }, [params?.id, router]);

  // ❌ Handle Error from Query
  useEffect(() => {
    if (error) {
      if (error.message === "403") {
        toast.error("ดูของคนอื่นไม่ได้นะจ้ะ");
      } else if (error.message === "No token") {
        // Handle no token if needed, usually covered by the other effect
      } else {
        console.error(error);
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
      }
    }
  }, [error]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 transition-colors">
        <ElementalLoader />
      </div>
    );
  }

  if (!data) {
    return notFound();
  }

  // ส่งข้อมูลที่ Fetch มาได้ ไปให้ ResultClient แสดงผลตามเดิม
  return <ResultClient data={data} />;
}
