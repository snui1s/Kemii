import ResultClient from "@/components/ResultClient";
import { notFound } from "next/navigation";

// ฟังก์ชันดึงข้อมูล (เหมือนเดิม)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getResultData(id: string) {
  if (!id || id === "undefined" || id === "null") return null;
  try {
    const res = await fetch(`${API_URL}/users/${id}/analysis`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching result data:", error);
    return null;
  }
}

// 👇 แก้ตรงนี้: params เป็น Promise<{ id: string }>
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: PageProps) {
  // 👇 ต้อง await params ก่อน ถึงจะดึง id ออกมาได้
  const { id } = await params;

  const data = await getResultData(id);

  if (!data) {
    notFound();
  }

  return <ResultClient data={data} />;
}
