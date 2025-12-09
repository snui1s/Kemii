"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Users, Wand2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import ElementalLoader from "@/components/ElementalLoader";
import AuthGuard from "@/components/AuthGuard";

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
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function GroupingPage() {
  const [numTeams, setNumTeams] = useState(2); // ค่าเริ่มต้น 2 ทีม
  const [result, setResult] = useState<{ teams: Team[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    axios.get(`${API_URL}/users`).then((res) => {
      setTotalUsers(res.data.length);
    });
  }, []);

  const MIN_MEMBERS_PER_TEAM = 2;
  const maxTeams =
    totalUsers > 0 ? Math.floor(totalUsers / MIN_MEMBERS_PER_TEAM) : 2;

  const handleGroup = async () => {
    setLoading(true);
    setResult(null);
    try {
      // ยิง API ไปหลังบ้าน
      const res = await axios.post(`${API_URL}/auto-group-teams`, {
        num_teams: numTeams,
      });
      setResult(res.data);
      toast.success("จัดทีมเสร็จแล้ว!");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        toast.error("ใจเย็นๆ น้าาา 🧊 พักหายใจสัก 1 นาทีแล้วลองใหม่ครับ");
      }
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
  if (loading)
    return (
      <div className="py-10 min-h-[400px] flex items-center justify-center">
        <ElementalLoader />
      </div>
    );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800 py-10 px-4 transition-colors">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-3">
              <Users className="text-blue-600 dark:text-blue-400" size={32} />
              Auto Team Builder
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              ให้ AI ช่วยเกลี่ยพลังธาตุ จัดทีมให้สมดุลที่สุด
            </p>
          </div>

          {/* Control Panel (กล่องเลือกจำนวน) */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-xl mx-auto text-center mb-12 transition-colors">
            <label className="block text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
              ต้องการแบ่งกี่ทีม?
            </label>

            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                onClick={() => setNumTeams((n) => Math.max(2, n - 1))}
                className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-2xl font-bold text-slate-600 dark:text-slate-300 transition"
              >
                -
              </button>

              <div className="text-5xl font-black text-blue-600 dark:text-blue-400 w-20">
                {numTeams}
              </div>
              <button
                // 4. ใส่ Logic ป้องกันที่ปุ่มบวก
                onClick={() => {
                  if (numTeams < maxTeams) {
                    setNumTeams((n) => n + 1);
                  } else {
                    toast.error(
                      `คนไม่พอครับ! สูงสุดได้แค่ ${maxTeams} ทีม (ทีมละ ${MIN_MEMBERS_PER_TEAM} คน)`
                    );
                  }
                }}
                disabled={numTeams >= maxTeams}
                className={`w-12 h-12 rounded-full text-2xl font-bold transition
                ${
                  numTeams >= maxTeams
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }
              `}
              >
                +
              </button>
            </div>

            <button
              onClick={handleGroup}
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2 dark:shadow-indigo-900/20"
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

          {!loading && result && (
            <div className="flex flex-col gap-8 animate-fade-in-up pb-20">
              {result.teams.map((team, index) => {
                const themeColor =
                  index % 4 === 0
                    ? "bg-red-600"
                    : index % 4 === 1
                    ? "bg-blue-600"
                    : index % 4 === 2
                    ? "bg-green-600"
                    : "bg-yellow-600";

                const lightTheme =
                  index % 4 === 0
                    ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-100 dark:border-red-800/30"
                    : index % 4 === 1
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-100 dark:border-blue-800/30"
                    : index % 4 === 2
                    ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-100 dark:border-green-800/30"
                    : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-100 dark:border-yellow-800/30";

                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition duration-300"
                  >
                    {/* --- Header (แถบยาวด้านบน) --- */}
                    <div
                      className={`${themeColor} p-4 text-white flex justify-between items-center px-6`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                          <Users size={24} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">
                            {team.team_name}
                          </h3>
                          <p className="text-white/80 text-sm">
                            Unit {index + 1}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/20 px-4 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                        {team.members.length} สมาชิก
                      </div>
                    </div>

                    {/* --- Body (แบ่งซ้าย-ขวา) --- */}
                    <div className="flex flex-col lg:flex-row">
                      {/* ฝั่งซ้าย: รายชื่อสมาชิก (กินพื้นที่ 60-70%) */}
                      <div className="p-6 lg:w-[45%] border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
                        <h4 className="text-slate-500 dark:text-slate-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                          <Users size={16} /> Roster / รายชื่อ
                        </h4>

                        {/* Grid ย่อยสำหรับรายชื่อ (2 คอลัมน์) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {team.members.map((member, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/50 transition"
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {member.name}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  ({member.animal})
                                </span>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full border bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-500 dark:text-slate-300`}
                              >
                                {member.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ฝั่งขวา: วิเคราะห์ (กินพื้นที่ 30-40%) */}
                      <div className="p-6 lg:w-[55%] flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                        {/* จุดแข็ง */}
                        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                          <h4 className="text-slate-500 dark:text-slate-400 font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Sparkles size={16} className="text-yellow-500" />{" "}
                            Strength
                          </h4>
                          <p>{team.strength}</p>
                        </div>

                        {/* คำแนะนำ (Management Tip) */}
                        <div className={`p-4 rounded-xl border ${lightTheme}`}>
                          <h4 className="font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                            💡 Management Tip
                          </h4>
                          <p className="text-sm leading-relaxed opacity-90">
                            {team.weakness}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
