"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

import ResultClient from "@/components/ResultClient";
import ElementalLoader from "@/components/ElementalLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;
  const { user, token, loading: authLoading } = useAuth();

  // State สำหรับเช็คสิทธิ์ (อาจจะไม่ต้องใช้ state แล้ว ถ้าใช้ user.id check ตรงๆ แต่เก็บไว้ก่อนเพื่อความชัวร์)
  const [isAuthorized, setIsAuthorized] = useState(false);

  // เช็คสิทธิ์การเข้าถึง
  useEffect(() => {
    if (authLoading) return;

    if (!token || !user) {
      toast.error("ไม่พบข้อมูลยืนยันตัวตน");
      router.push("/");
      return;
    }

    if (user.id.toString() !== userId) {
      toast.error("ไม่สามารถดูข้อมูลของคนอื่นได้ครับ", { id: "auth-error" });
      router.replace("/");
      return;
    }

    setIsAuthorized(true);
  }, [userId, router, user, token, authLoading]);

  // Fetch ข้อมูลจาก Backend
  const { data, isLoading, error } = useQuery({
    queryKey: ["analysis", userId],
    queryFn: async () => {
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
    enabled: isAuthorized && !!token,
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
  // 1. Loading State (Auth or Data or Check)
  if (authLoading || isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/20 transition-colors">
        <ElementalLoader />
      </div>
    );
  }

  // 2. กำลัง fetch ข้อมูล
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/20 transition-colors">
        <ElementalLoader />
      </div>
    );
  }

  // 3. ไม่มีข้อมูล
  if (!data || !data.user || !data.analysis) {
    return notFound();
  }

  // 4. ข้อมูลพร้อม -> แสดงผล
  return <ResultClient user={data.user} analysis={data.analysis} />;
}
