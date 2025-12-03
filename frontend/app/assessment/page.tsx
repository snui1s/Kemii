"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Check, X, Info, Play } from "lucide-react";
import toast from "react-hot-toast";

const questions = [
  {
    id: 1,
    text: "เวลาต้องทำงานสำคัญ คุณมักจะ ...",
    options: [
      { label: "ลงมือทำเลยจ้า ไม่รอใคร", value: "D" },
      { label: "ชวนเพื่อนร่วมงานคุยก่อนเริ่ม", value: "I" },
      { label: "ทำงานตามแผนและเก็บรายละเอียดสุดๆ", value: "S" },
      { label: "ค่อยๆทำไปทีละขั้นตอน ไม่รีบๆ", value: "C" },
    ],
  },
  {
    id: 2,
    text: "เวลาที่ต้องทำงานเป็นทีม คุณคิดว่าตัวเอง ...",
    options: [
      { label: "พยายามให้ทีมบรรลุเป้าหมายให้ได้", value: "D" },
      { label: "พูดคุยสนุกสนานกับเพื่อนร่วมงาน", value: "I" },
      { label: "ตรวจสอบงานให้เรียบร้อยก่อนส่ง", value: "C" },
      { label: "ใจเย็น คอยช่วยให้ทีมทำงานสบาย ๆ", value: "S" },
    ],
  },
  {
    id: 3,
    text: "เมื่อมีไอเดียใหม่ ๆ คุณมักจะ ...",
    options: [
      { label: "แบ่งปันและชวนคนอื่นทำตาม ", value: "I" },
      { label: "ลงมือทำไอเดียนั้นทันที", value: "D" },
      { label: "วิเคราะห์และคิดให้แน่ใจก่อนลงมือ", value: "C" },
      { label: "ปรับไอเดียให้เข้ากับคนรอบตัว", value: "S" },
    ],
  },
  {
    id: 4,
    text: "ถ้าเกิดปัญหากะทันหันในทีม คุณมักจะ ...",
    options: [
      { label: "ค่อย ๆ คิดและวางแผนแก้ทีละขั้น", value: "C" },
      { label: "พยายามสื่อสารให้ทุกคนเข้าใจ", value: "I" },
      { label: "ตัดสินใจแก้ปัญหาเองก่อน", value: "D" },
      { label: "ช่วยให้ทุกคนใจเย็นและทำตามแผน", value: "S" },
    ],
  },
  {
    id: 5,
    text: "เวลาที่ต้องตัดสินใจเรื่องซับซ้อน คุณมักจะ ...",
    options: [
      { label: "รวบรวมข้อมูลให้ครบถ้วนก่อนสรุป", value: "C" },
      { label: "ทำเองเลยโดยไม่รอใคร", value: "D" },
      { label: "ใช้เวลาค่อย ๆ ตัดสินใจ ไม่รีบ", value: "S" },
      { label: "คุยกับเพื่อนร่วมงานเพื่อขอไอเดีย", value: "I" },
    ],
  },
  {
    id: 6,
    text: "เวลาที่ต้องเลือกงานที่ชอบ คุณมักจะเลือก ...",
    options: [
      { label: "งานที่ได้คุยและร่วมมือกับคนอื่น", value: "I" },
      { label: "งานที่ค่อย ๆ ทำไป สม่ำเสมอและไม่เครียด", value: "S" },
      { label: "งานที่ท้าทายและต้องตัดสินใจเร็ว", value: "D" },
      { label: "งานที่ละเอียด ชัดเจนตามขั้นตอน", value: "C" },
    ],
  },
  {
    id: 7,
    text: "เวลาต้องสื่อสารกับทีมใหม่ ๆ คุณมักจะ ...",
    options: [
      { label: "ใจเย็น รับฟังคนอื่นก่อนพูด", value: "S" },
      { label: "เตรียมข้อมูลและตรวจสอบก่อนพูด", value: "C" },
      { label: "ทำให้สนุกและชวนทุกคนคุย", value: "I" },
      { label: "บอกให้ทำตามสิ่งที่คุณคิด", value: "D" },
    ],
  },
  {
    id: 8,
    text: "เวลาที่ได้รับงานใหม่ คุณมักจะ ...",
    options: [
      { label: "ลงมือทำทันทีเพื่อให้เสร็จเร็ว", value: "D" },
      { label: "ทำงานไปเรื่อย ๆ อย่างมั่นคง", value: "S" },
      { label: "วางแผนและตรวจสอบความถูกต้องก่อนเริ่ม", value: "C" },
      { label: "ชวนเพื่อนร่วมงานช่วยคิดไอเดีย", value: "I" },
    ],
  },
  {
    id: 9,
    text: "เวลาที่ต้องทำงานเป็นกลุ่ม คุณมักจะ ...",
    options: [
      { label: "ตรวจสอบงานและวิเคราะห์ก่อนสรุป", value: "C" },
      { label: "ผลักดันให้ทีมทำงานให้เสร็จทันเวลา", value: "D" },
      { label: "พูดคุยกับทีมเพื่อให้บรรยากาศสนุก", value: "I" },
      { label: "ทำงานอย่างสม่ำเสมอและช่วยให้ทีมสงบ", value: "S" },
    ],
  },
  {
    id: 10,
    text: "เวลาที่ต้องทำหลายงานพร้อมกัน คุณมักจะ ...",
    options: [
      { label: "ทำทีละอย่างอย่างใจเย็น", value: "S" },
      { label: "ชวนคนอื่นคุยเพื่อแบ่งงาน", value: "I" },
      { label: "จัดลำดับความสำคัญและตัดสินใจเอง", value: "D" },
      { label: "วางแผนอย่างละเอียดก่อนทำ", value: "C" },
    ],
  },
  {
    id: 11,
    text: "เวลาที่มีโอกาสแสดงไอเดีย คุณมักจะ ...",
    options: [
      { label: "ทำให้สนุกและดึงดูดให้คนสนใจ", value: "I" },
      { label: "พูดอย่างมั่นใจและให้คนฟังทำตาม", value: "D" },
      { label: "ใจเย็น ฟังความคิดเห็นของคนอื่นด้วย", value: "S" },
      { label: "เตรียมข้อมูลให้รอบคอบก่อนพูด", value: "C" },
    ],
  },
  {
    id: 12,
    text: "เวลาที่ต้องแก้ไขปัญหา คุณมักจะ ...",
    options: [
      { label: "ตรวจสอบข้อมูลและวิธีแก้ให้ถูกต้อง", value: "C" },
      { label: "ช่วยให้คนรอบตัวใจเย็นและทำตามขั้นตอน", value: "S" },
      { label: "ตัดสินใจแก้ปัญหาเอง", value: "D" },
      { label: "แนะนำให้ทีมลองทำตามไอเดีย", value: "I" },
    ],
  },
  {
    id: 13,
    text: "เวลาที่ต้องรับมือกับสถานการณ์ใหม่ คุณมักจะ ...",
    options: [
      { label: "สื่อสารกับเพื่อนร่วมทีมให้เข้าใจ", value: "I" },
      { label: "วิเคราะห์และตรวจสอบก่อนลงมือ", value: "C" },
      { label: "ปรับตัวค่อย ๆ ทำทีละขั้น", value: "S" },
      { label: "ลงมือทำและแก้ไขทันที", value: "D" },
    ],
  },
  {
    id: 14,
    text: "เวลาที่ต้องเลือกวิธีทำงาน คุณมักจะ ...",
    options: [
      { label: "ทำตามขั้นตอนอย่างมั่นคงและใจเย็น", value: "S" },
      { label: "เลือกทำทันทีตามความคิดของตัวเอง", value: "D" },
      { label: "พิจารณาข้อมูลและวางแผนก่อนตัดสินใจ", value: "C" },
      { label: "ชวนคนอื่นแลกเปลี่ยนความเห็น", value: "I" },
    ],
  },
  {
    id: 15,
    text: "เวลาที่ต้องทำงานร่วมกับคนใหม่ คุณมักจะ ...",
    options: [
      { label: "วางแผนและวิเคราะห์ก่อนทำ", value: "C" },
      { label: "พูดคุยและเข้าหาคนง่าย", value: "I" },
      { label: "แนะนำวิธีทำงานตามความคิดของตัวเอง", value: "D" },
      { label: "รับผิดชอบงานและทำให้เสร็จตามสัญญา", value: "S" },
    ],
  },
];

const fullQuestions = [...questions].map((q, i) => ({
  ...q,
  id: i + 1, // run id ใหม่ 1-15
}));

export default function AssessmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const [answers, setAnswers] = useState<
    Record<number, { most: string | null; least: string | null }>
  >({});

  const handleSelect = (
    questionId: number,
    value: string,
    type: "most" | "least"
  ) => {
    const prevAnswer = answers[questionId] || { most: null, least: null };

    const updatedAnswer = { ...prevAnswer };

    if (type === "most" && updatedAnswer.least === value) {
      updatedAnswer.least = null;
    }
    if (type === "least" && updatedAnswer.most === value) {
      updatedAnswer.most = null;
    }

    updatedAnswer[type] = value;

    setAnswers({
      ...answers,
      [questionId]: updatedAnswer,
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("กรุณากรอกชื่อก่อนนะครับ 🥺");
      return;
    }

    const answeredCount = Object.values(answers).filter(
      (a) => a.most && a.least
    ).length;
    if (answeredCount < fullQuestions.length) {
      toast.error("ตอบให้ครบทุกข้อก่อนน้า เหลืออีกนิดเดียว");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name,
      answers: Object.entries(answers).map(([qid, val]) => ({
        question_id: Number(qid),
        most_value: val.most,
        least_value: val.least,
      })),
    };

    try {
      const res = await axios.post(
        "http://localhost:8000/submit-assessment",
        payload
      );
      const newUser = res.data;
      localStorage.setItem("myUserId", newUser.id.toString());
      localStorage.setItem("myName", newUser.name);
      localStorage.setItem("myAnimal", newUser.animal);
      localStorage.setItem("myScores", JSON.stringify(newUser.scores));
      window.dispatchEvent(new Event("user-updated"));
      toast.success("บันทึกสำเร็จ! ยินดีต้อนรับคุณ" + name);
      router.push(`/result/${newUser.id}`);
    } catch (err) {
      console.error(err);
      toast.error("อุ๊ย ระบบมีปัญหา ลองใหม่อีกทีนะครับ");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* --- ✨ ส่วนที่เพิ่ม: Tutorial Modal --- */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-100 text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Info size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                วิธีการทำแบบประเมิน
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                อ่านสักนิด เพื่อผลลัพธ์ที่แม่นยำ!
              </p>
            </div>

            {/* Content: อธิบายวิธีเลือก */}
            <div className="p-6 space-y-6">
              {/* กฎข้อ 1 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 border border-green-200">
                  <Check size={20} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700">
                    1. ตรงกับคุณมากที่สุด
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    ในแต่ละข้อ ให้เลือก 1 ตัวเลือกที่เป็นตัวตนของคุณมากที่สุด
                    (ช่องสีเขียว)
                  </p>
                </div>
              </div>

              {/* กฎข้อ 2 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0 border border-red-200">
                  <X size={20} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700">
                    2. ตรงกับคุณน้อยที่สุด
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    และเลือกอีก 1 ตัวเลือก ที่ไม่ใช่ตัวคุณ
                    หรือเป็นตัวคุณน้อยที่สุด (ช่องสีแดง)
                  </p>
                </div>
              </div>

              {/* ตัวอย่างภาพจำลอง (Visual Aid) */}
              {/* --- ✨ Visual Aid (ฉบับ Interactive) --- */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-3 uppercase font-bold tracking-wider text-center">
                  ตัวอย่างการตอบคำถาม
                </p>

                <div className="space-y-3">
                  {/* แถวที่ 1: จำลองว่าเลือก "มากที่สุด" */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm relative overflow-hidden group hover:border-green-300 transition">
                    <div className="absolute inset-y-0 left-0 w-1 bg-green-500 rounded-r-full"></div>
                    <span className="text-sm text-slate-700 font-medium pl-2">
                      เป็นคนชอบเข้าสังคม
                    </span>
                    <div className="flex gap-2 relative z-10">
                      {/* ปุ่มเขียว (Active) */}
                      <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200 scale-110 transition-transform">
                        <Check size={20} strokeWidth={3} />
                      </div>
                      {/* ปุ่มแดง (Inactive) */}
                      <div className="w-10 h-10 rounded-full border-2 border-slate-200 text-slate-300 flex items-center justify-center opacity-50">
                        <X size={20} strokeWidth={3} />
                      </div>
                    </div>
                  </div>

                  {/* แถวที่ 2: จำลองว่าเลือก "น้อยที่สุด" */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm relative overflow-hidden group hover:border-red-300 transition">
                    <div className="absolute inset-y-0 left-0 w-1 bg-red-500 rounded-r-full"></div>
                    <span className="text-sm text-slate-700 font-medium pl-2">
                      ชอบทำงานคนเดียวเงียบๆ
                    </span>
                    <div className="flex gap-2 relative z-10">
                      {/* ปุ่มเขียว (Inactive) */}
                      <div className="w-10 h-10 rounded-full border-2 border-slate-200 text-slate-300 flex items-center justify-center opacity-50">
                        <Check size={20} strokeWidth={3} />
                      </div>
                      {/* ปุ่มแดง (Active) */}
                      <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200 scale-110 transition-transform">
                        <X size={20} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: ปุ่มเริ่ม */}
            <div className="p-6 pt-0">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-slate-200 transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                เข้าใจแล้ว! เริ่มทำเลย <Play size={20} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- ส่วนแบบประเมิน --- */}
      <h1 className="text-3xl font-bold text-center mb-2 text-slate-800">
        แบบประเมิน 4Elements
      </h1>
      <p className="text-center text-gray-500 mb-8">
        ค้นหานิสัยประจำตัวของคุณในการทำงาน
      </p>

      {/* ส่วนกรอกชื่อ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 text-slate-900">
        <label className="block font-semibold mb-2">
          ชื่อของคุณ (หรือชื่อเล่น)
        </label>
        <input
          type="text"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
          placeholder="เช่น สมชาย ใจดี"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {fullQuestions.map((q, index) => {
          const ans = answers[q.id] || { most: null, least: null };

          return (
            <div
              key={q.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
            >
              <h3 className="font-semibold text-lg mb-4 text-slate-800">
                <span className="text-blue-600 mr-2">ข้อ {index + 1}.</span>
                {q.text}
              </h3>

              {/* Header ตาราง */}
              <div className="grid grid-cols-12 gap-2 text-sm text-gray-400 mb-2 px-2">
                <div className="col-span-8">
                  เลือกความน่าจะทำมากสุดและน้อยสุด
                </div>
                <div className="col-span-2 text-center text-green-600 font-bold">
                  มากที่สุด
                </div>
                <div className="col-span-2 text-center text-red-500 font-bold">
                  น้อยที่สุด
                </div>
              </div>

              {/* ตัวเลือก */}
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <div
                    key={opt.value}
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100"
                  >
                    {/* Text ตัวเลือก */}
                    <div className="col-span-8 text-slate-700">{opt.label}</div>

                    {/* ปุ่ม Most (M) */}
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => handleSelect(q.id, opt.value, "most")}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                          ${
                            ans.most === opt.value
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-200 text-gray-300 hover:border-green-300"
                          }
                        `}
                      >
                        <Check size={20} />
                      </button>
                    </div>

                    {/* ปุ่ม Least (L) */}
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => handleSelect(q.id, opt.value, "least")}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                          ${
                            ans.least === opt.value
                              ? "bg-red-500 border-red-500 text-white"
                              : "border-gray-200 text-gray-300 hover:border-red-300"
                          }
                        `}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ปุ่มส่ง */}
      <div className="mt-10 bottom-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition disabled:opacity-50"
        >
          {isSubmitting ? "กำลังคำนวณธาตุ... 🔮" : "ส่งผลประเมิน"}
        </button>
      </div>
    </div>
  );
}
