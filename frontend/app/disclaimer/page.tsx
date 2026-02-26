import React from "react";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 font-[family-name:var(--font-line-seed)]">
      <div className="bg-[var(--background)]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm border border-black/5 dark:border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="w-fit p-3 bg-[var(--highlight)]/10 rounded-2xl text-[var(--highlight)]">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] leading-tight">
            ข้อจำกัดความรับผิดชอบ
          </h1>
        </div>

        <div className="space-y-6 text-[var(--foreground)] opacity-90 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
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
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
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
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              3. ความแม่นยำของ AI
            </h2>
            <p>
              ระบบใช้ปัญญาประดิษฐ์ (AI) ในการวิเคราะห์ ซึ่งอาจมีความคลาดเคลื่อน
              หรือไม่ตรงกับความเป็นจริง 100%
              ผู้ใช้งานควรใช้วิจารณญาณในการอ่านและนำไปประยุกต์ใช้
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              4. Kemii Golden Formula (Algorithm Transparency)
            </h2>
            <p className="mb-4">
              การจับคู่ทีมใช้สูตรทางคณิตศาสตร์{" "}
              <strong>Kemii Golden Formula</strong> ที่คำนวณจากค่าความหลากหลาย
              (Normalized Variance) และค่าเฉลี่ย (Normalized Mean)
              เพื่อสร้างทีมที่มีความสมดุล โดยอ้างอิงจากโค้ดต้นฉบับ:
            </p>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg font-mono text-xs md:text-sm text-[var(--foreground)] border border-black/5 dark:border-white/5 overflow-x-auto whitespace-pre">
              {`Cost = 1.5 * Var*(C) + 1.5 * Var*(A) + 1.0 * Var*(E) + 1.0 * Var*(O) + 1.0 * Mean*(N) + 2.0 * max(0, 0.625 - Mean*(A))`}
            </div>
            <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <h4 className="font-bold text-[var(--foreground)]">
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
