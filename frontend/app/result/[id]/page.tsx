"use client"; // 👈 สำคัญ: ต้องเป็น Client Component เพื่อเช็ค LocalStorage

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ResultClient from "@/components/ResultClient";
import { notFound } from "next/navigation";
import toast from "react-hot-toast";
import ElementalLoader from "@/components/ElementalLoader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ResultPage() {
  const params = useParams(); // ใช้ hook แทน props ใน client component
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // ฟังก์ชันสำหรับเช็คสิทธิ์และดึงข้อมูล
    const fetchData = async () => {
      const id = params?.id as string;
      const myId = localStorage.getItem("myUserId");

      if (!myId || myId !== id) {
        toast.error("ไม่สามารถดูข้อมูลของคนอื่นได้ครับ", {
          id: "security-guard", // กัน toast ซ้อน
          duration: 4000,
        });
        router.replace("/"); // ดีดกลับหน้าแรกทันที
        return;
      }
      setIsAuthorized(true);

      try {
        const res = await fetch(`${API_URL}/users/${id}/analysis`);
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        const jsonData = await res.json();
        setData(jsonData);
      } catch (error) {
        console.error("Error:", error);
        // ถ้าหาไม่เจอจริงๆ อาจจะ redirect หรือโชว์ error state
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchData();
    }
  }, [params?.id, router]);

  if (loading || !isAuthorized) {
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
