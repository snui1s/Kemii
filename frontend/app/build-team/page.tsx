"use client";
import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios"; // นำเข้า AxiosError เพื่อ Type-safe catch
import { Users, UserPlus, Save, RefreshCcw, Crown } from "lucide-react";
import toast from "react-hot-toast";
import UserCard from "@/components/UserCard";
import ModernSelect from "@/components/ModernSelect";

// --- 1. ประกาศ Interface ให้ครบ (Type-Safe Rules) ---

interface User {
  id: number;
  name: string;
  animal: string;
  dominant_type: string;
}

interface Member extends User {
  role?: string;
}

interface TeamResult {
  leader: User;
  members: Member[];
  reason: string;
  team_name: string;
}

interface ApiErrorResponse {
  detail: string;
}

export default function BuildTeamPage() {
  // Data State
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Config State
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [memberCount, setMemberCount] = useState(2);
  const [strategy, setStrategy] = useState("Balanced");

  // Result State
  const [aiResult, setAiResult] = useState<TeamResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. ดึงคนว่างงาน
  const fetchAvailable = async () => {
    try {
      const res = await axios.get<User[]>(
        "http://localhost:8000/users/available"
      );
      setAvailableUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error("ดึงข้อมูลไม่สำเร็จ");
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  // 2. สั่ง AI หาคน
  const handleRecommend = async () => {
    if (!selectedLeaderId) {
      toast.error("เลือกหัวหน้าทีมก่อนครับ!");
      return;
    }
    setLoading(true);
    setAiResult(null); // Clear เก่า

    try {
      const res = await axios.post<TeamResult>(
        "http://localhost:8000/recommend-team-members",
        {
          leader_id: Number(selectedLeaderId),
          member_count: memberCount,
          strategy: strategy,
        }
      );
      setAiResult(res.data);
      toast.success("AI จัดทัพให้แล้ว!");
    } catch (error) {
      // Type-safe Error Handling
      const err = error as AxiosError<ApiErrorResponse>;
      const msg = err.response?.data?.detail || "เกิดข้อผิดพลาดในการจัดทีม";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. บันทึกทีมจริง
  const handleConfirm = async () => {
    if (!aiResult) return;
    try {
      const memberIds = aiResult.members.map((m) => m.id);

      await axios.post("http://localhost:8000/confirm-team", {
        team_name: aiResult.team_name,
        member_ids: [aiResult.leader.id, ...memberIds],
      });

      toast.success(`บันทึกทีม "${aiResult.team_name}" เรียบร้อย!`);

      // Reset หน้าจอ
      setAiResult(null);
      setSelectedLeaderId("");
      fetchAvailable(); // ดึงคนว่างใหม่ (คนที่ถูกเลือกจะหายไป)
    } catch (err) {
      console.error(err);
      toast.error("บันทึกไม่สำเร็จ");
    }
  };

  // 4. ปุ่ม Reset (สำหรับ Dev Test)
  const handleReset = async () => {
    if (confirm("ล้างทีมทั้งหมด? ทุกคนจะกลับมาว่างงานนะ")) {
      try {
        await axios.post("http://localhost:8000/reset-teams");
        fetchAvailable();
        toast.success("ล้างกระดานเรียบร้อย!");
      } catch (err) {
        console.error(err);
        toast.error("Reset ไม่สำเร็จ");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-900">
        {/* --- LEFT PANEL: Config --- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <UserPlus className="text-blue-600" /> สร้างทีมใหม่
            </h2>

            {/* 1. เลือกหัวหน้า */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                1. เลือกหัวหน้าทีม (Leader)
              </label>
              <ModernSelect
                value={selectedLeaderId}
                onChange={(val) => setSelectedLeaderId(val)}
                placeholder="-- เลือกจากคนที่ว่างอยู่ --"
                // แปลงข้อมูล User ให้เป็น format ที่ Dropdown เข้าใจ (label, subLabel)
                options={availableUsers.map((u) => ({
                  id: u.id,
                  label: u.name,
                  subLabel: u.animal, // โชว์สัตว์ด้วย เช่น "สมชาย (กระทิง)"
                  element: u.dominant_type,
                }))}
              />
            </div>

            {/* 2. จำนวนลูกน้อง */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                2. ต้องการลูกน้องกี่คน?
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMemberCount(Math.max(1, memberCount - 1))}
                  className="w-10 h-10 rounded-lg bg-slate-100 font-bold hover:bg-slate-200"
                >
                  -
                </button>
                <span className="text-xl font-bold w-8 text-center">
                  {memberCount}
                </span>
                <button
                  onClick={() => setMemberCount(memberCount + 1)}
                  className="w-10 h-10 rounded-lg bg-slate-100 font-bold hover:bg-slate-200"
                >
                  +
                </button>
              </div>
            </div>

            {/* 3. กลยุทธ์ */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                3. สไตล์ทีม (Strategy)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Balanced", "Aggressive", "Creative", "Supportive"].map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setStrategy(s)}
                      className={`p-2 text-sm rounded-lg border transition ${
                        strategy === s
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {s === "Balanced" && "⚖️ สมดุล"}
                      {s === "Aggressive" && "🔥 สายลุย"}
                      {s === "Creative" && "💡 ไอเดีย"}
                      {s === "Supportive" && "❤️ ซัพพอร์ต"}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleRecommend}
              disabled={loading || !selectedLeaderId}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow-lg"
            >
              {loading ? "AI กำลังเฟ้นหา..." : "🔍 ให้ AI หาคนให้"}
            </button>

            {/* Reset Button (Bottom) */}
            <button
              onClick={handleReset}
              className="w-full mt-4 text-xs text-slate-400 hover:text-red-500 flex items-center justify-center gap-1"
            >
              <RefreshCcw size={12} /> ล้างทีมทั้งหมด (Reset DB)
            </button>
          </div>
        </div>

        {/* --- RIGHT PANEL: Result --- */}
        <div className="lg:col-span-8">
          {!aiResult ? (
            // Empty State
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
              <Users size={48} className="mb-4 opacity-20" />
              <p>เลือกหัวหน้าและกลยุทธ์ เพื่อเริ่มจัดทีม</p>
            </div>
          ) : (
            // Result State
            <div className="space-y-6 animate-fade-in-up">
              {/* Header ทีม */}
              <div className="bg-linear-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <div className="text-sm opacity-80 uppercase tracking-widest font-bold">
                    Recommended Team
                  </div>
                  <h2 className="text-3xl font-black">{aiResult.team_name}</h2>
                </div>
                <button
                  onClick={handleConfirm}
                  className="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold shadow-md hover:scale-105 transition flex items-center gap-2"
                >
                  <Save size={18} /> ยืนยันทีมนี้
                </button>
              </div>

              {/* Analysis */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-sm leading-relaxed">
                <span className="font-bold">✨ ทำไมถึงเวิร์ค: </span>
                {aiResult.reason}
              </div>

              {/* Leader Card */}
              <div>
                <h3 className="text-slate-500 font-bold mb-3 flex items-center gap-2">
                  <Crown size={18} className="text-yellow-500" /> หัวหน้าทีม
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UserCard
                    name={aiResult.leader.name}
                    animal={aiResult.leader.animal}
                    type={aiResult.leader.dominant_type}
                  />
                </div>
              </div>

              {/* Members Grid */}
              <div>
                <h3 className="text-slate-500 font-bold mb-3 flex items-center gap-2">
                  <Users size={18} /> สมาชิกที่ AI แนะนำ (
                  {aiResult.members.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiResult.members.map((m) => (
                    <UserCard
                      key={m.id}
                      name={m.name}
                      animal={m.animal}
                      type={m.dominant_type}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
