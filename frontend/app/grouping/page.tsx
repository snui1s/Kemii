"use client";
import { useState } from "react";
import axios from "axios";
import { Users, Wand2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import ElementalLoader from "@/components/ElementalLoader";

// Interface รับผลลัพธ์จาก AI
interface Member {
  name: string;
  role: string;
  animal: string;
}

interface Team {
  team_name: string;
  members: Member[];
  strength: string;
  weakness: string;
}

export default function GroupingPage() {
  const [numTeams, setNumTeams] = useState(2); // ค่าเริ่มต้น 2 ทีม
  const [result, setResult] = useState<{ teams: Team[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGroup = async () => {
    setLoading(true);
    setResult(null);
    try {
      // ยิง API ไปหลังบ้าน
      const res = await axios.post("http://localhost:8000/auto-group-teams", {
        num_teams: numTeams,
      });
      setResult(res.data);
      toast.success("จัดทีมเสร็จแล้ว!");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = (err.response.data as { detail: string }).detail;
        toast.error(errorMessage || "เกิดข้อผิดพลาดจาก Server");
      } else {
        toast.error("เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
            <Users className="text-blue-600" size={32} />
            Auto Team Builder
          </h1>
          <p className="text-slate-500 mt-2">
            ให้ AI ช่วยเกลี่ยพลังธาตุ จัดทีมให้สมดุลที่สุด
          </p>
        </div>

        {/* Control Panel (กล่องเลือกจำนวน) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-xl mx-auto text-center mb-12">
          <label className="block text-lg font-medium text-slate-700 mb-4">
            ต้องการแบ่งกี่ทีม?
          </label>

          <div className="flex items-center justify-center gap-6 mb-8">
            <button
              onClick={() => setNumTeams((n) => Math.max(2, n - 1))}
              className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-2xl font-bold text-slate-600 transition"
            >
              -
            </button>

            <div className="text-5xl font-black text-blue-600 w-20">
              {numTeams}
            </div>

            <button
              onClick={() => setNumTeams((n) => n + 1)}
              className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-2xl font-bold text-slate-600 transition"
            >
              +
            </button>
          </div>

          <button
            onClick={handleGroup}
            disabled={loading}
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="opacity-50">Loading ...</span>
            ) : (
              <>
                <Wand2 /> ร่ายมนตร์จัดทีม
              </>
            )}
          </button>
        </div>
        {loading && (
          <div className="py-10">
            <ElementalLoader />
          </div>
        )}
        {!loading && result && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {result.teams.map((team, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden hover:shadow-lg transition duration-300 flex flex-col"
              >
                {/* Header ทีม */}
                <div
                  className={`p-4 text-center text-white ${
                    index % 3 === 0
                      ? "bg-red-500"
                      : index % 3 === 1
                      ? "bg-blue-500"
                      : "bg-green-500"
                  }`}
                >
                  <h3 className="text-xl font-bold shadow-text">
                    {team.team_name}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {team.members.length} สมาชิก
                  </p>
                </div>

                {/* รายชื่อสมาชิก */}
                <div className="p-6 flex-1">
                  <ul className="space-y-3">
                    {team.members.map((member, i) => (
                      <li
                        key={i}
                        className="flex justify-between items-center p-2 rounded bg-slate-50"
                      >
                        <span className="font-semibold text-slate-700">
                          {member.name} ({member.animal})
                        </span>
                        <span className="text-xs px-2 py-1 bg-white border rounded-full text-slate-500">
                          {member.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* วิเคราะห์จุดแข็ง/อ่อน */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-sm space-y-2 ">
                  <div className="flex gap-2">
                    <Sparkles
                      size={16}
                      className="text-yellow-500 shrink-0 mt-0.5"
                    />
                    <span className="text-slate-600 ml-2">{team.strength}</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-lg shrink-0">💡</span>
                    <div>
                      <span className="font-bold text-slate-700">
                        เคล็ดลับการบริหาร:{" "}
                      </span>
                      <span className="text-slate-600">{team.weakness}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
