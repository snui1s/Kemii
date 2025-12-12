"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import toast from "react-hot-toast";

import ResultClient from "@/components/ResultClient";
import ElementalLoader from "@/components/ElementalLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  // State สำหรับเช็คสิทธิ์
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // เช็คสิทธิ์การเข้าถึง
  useEffect(() => {
    const myId = localStorage.getItem("myUserId");
    const token = localStorage.getItem("myToken");

    if (!token) {
      toast.error("ไม่พบข้อมูลยืนยันตัวตน");
      router.push("/");
      return;
    }

    if (myId !== userId) {
      toast.error("ไม่สามารถดูข้อมูลของคนอื่นได้ครับ", { id: "auth-error" });
      router.replace("/");
      return;
    }

    setIsAuthorized(true);
    setIsChecking(false);
  }, [userId, router]);

  // Fetch ข้อมูลจาก Backend
  const { data, isLoading, error } = useQuery({
    queryKey: ["analysis", userId],
    queryFn: async () => {
      const token = localStorage.getItem("myToken");
      if (!token) throw new Error("No token");

      const res = await fetch(`${API_URL}/users/${userId}/analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("403");
        if (res.status === 404) throw new Error("404");
        throw new Error("Failed to fetch");
      }

      return res.json();
    },
    enabled: isAuthorized, // รอจนกว่าจะ authorized แล้วค่อย fetch
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      if (error.message === "403") {
        toast.error("ดูของคนอื่นไม่ได้นะจ้ะ");
        router.replace("/");
      } else if (error.message === "404") {
        toast.error("ไม่พบข้อมูลผู้ใช้");
        router.replace("/");
      } else {
        console.error(error);
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
      }
    }
  }, [error, router]);

  // --- LOADING STATES ---

  // 1. กำลังเช็คสิทธิ์
  if (isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 transition-colors">
        <ElementalLoader />
      </div>
    );
  }

  // 2. กำลัง fetch ข้อมูล
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 transition-colors">
        <ElementalLoader />
      </div>
    );
  }

  // 3. ไม่มีข้อมูล
  if (!data || !data.user || !data.analysis) {
    return notFound();
  }

  // 🐛 DEBUG: ดูข้อมูลที่ได้รับจาก Backend
  console.log("[ResultPage] DATA RECEIVED:");
  console.log("  - user.id:", data.user.id);
  console.log("  - user.name:", data.user.name);
  console.log("  - user.character_class:", data.user.character_class);
  console.log("  - analysis.class_title:", data.analysis.class_title);

  // 4. ข้อมูลพร้อม -> แสดงผล
  return <ResultClient user={data.user} analysis={data.analysis} />;
}
