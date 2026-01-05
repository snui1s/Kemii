import React from "react";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-600 dark:text-yellow-400">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            ข้อจำกัดความรับผิดชอบ (Disclaimer)
          </h1>
        </div>

        <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              1. เพื่อความบันเทิงและการพัฒนาทีมเท่านั้น
            </h2>
            <p>
              ผลการวิเคราะห์บุคลิกภาพ (Big Five) และคำแนะนำการจับคู่ทีมจาก AI
              บนเว็บไซต์นี้ จัดทำขึ้นเพื่อวัตถุประสงค์ใน
              <strong> ความบันเทิง</strong> และ
              <strong> ส่งเสริมกิจกรรมกลุ่มสัมพันธ์</strong> เท่านั้น
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              2. ไม่ใช่คำแนะนำทางการแพทย์หรือจิตวิทยา
            </h2>
            <p>
              ข้อมูลที่ได้จากเว็บไซต์นี้ <strong>ไม่ใช่</strong>{" "}
              การวินิจฉัยทางการแพทย์ การบำบัดทางจิตวิทยา
              หรือเครื่องมือคัดกรองบุคลากรเพื่อการจ้างงาน (Recruitment)
              ที่เป็นทางการ
            </p>
            <p className="mt-2">
              ผู้ใช้งานไม่ควรนำผลลัพธ์ไปตัดสิน ตีตรา หรือเลือกปฏิบัติ
              (Discriminate) ต่อบุคคลอื่นในชีวิตจริง
              หรือใช้เป็นเกณฑ์หลักในการตัดสินใจเรื่องสำคัญ
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              3. ความแม่นยำของ AI
            </h2>
            <p>
              ระบบใช้ปัญญาประดิษฐ์ (AI) ในการวิเคราะห์ ซึ่งอาจมีความคลาดเคลื่อน
              หรือไม่ตรงกับความเป็นจริง 100%
              ผู้ใช้งานควรใช้วิจารณญาณในการอ่านและนำไปประยุกต์ใช้
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              4. Kemii Golden Formula (Algorithm Transparency)
            </h2>
            <p className="mb-4">
              การจับคู่ทีมใช้สูตรทางคณิตศาสตร์{" "}
              <strong>Kemii Golden Formula</strong> ที่คำนวณจากค่าความหลากหลาย
              (Normalized Variance) และค่าเฉลี่ย (Normalized Mean)
              เพื่อสร้างทีมที่มีความสมดุล โดยอ้างอิงจากโค้ดต้นฉบับ:
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg font-mono text-xs md:text-sm text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre">
              {`Cost = 1.5 * Var*(C) + 1.5 * Var*(A) + 1.0 * Var*(E) + 1.0 * Var*(O) + 1.0 * Mean*(N) + 2.0 * max(0, 0.625 - Mean*(A))`}
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-500">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">
                ตัวแปรสำคัญ (Variables):
              </h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Var* (Normalized Variance):</strong> Variance / 400
                  (ค่าความกระจายหารด้วย 400)
                </li>
                <li>
                  <strong>Mean* (Normalized Mean):</strong> (Mean - 10) / 40
                  (แปลงช่วงคะแนน 10-50 ให้อยู่ในสเกล 0-1)
                </li>
                <li>
                  <strong>Penalty:</strong> หากค่าเฉลี่ย A ต่ำกว่า 0.625
                  (เทียบเท่าคะแนน ~35/50) จะมีโทษปรับ 2 เท่า
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
