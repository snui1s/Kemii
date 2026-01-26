import React from "react";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 font-[family-name:var(--font-line-seed)]">
      <div className="bg-[var(--background)]/80 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[var(--highlight)]/10 rounded-full text-[var(--highlight)]">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            นโยบายความเป็นส่วนตัว (Privacy Policy)
          </h1>
        </div>

        <div className="space-y-6 text-[var(--foreground)] opacity-90 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              1. ข้อมูลที่เราเก็บรวบรวม
            </h2>
            <p>
              เว็บไซต์ <strong>Kemii</strong>{" "}
              มีการจัดเก็บข้อมูลบางส่วนของท่านเพื่อใช้ในการประมวลผลและแสดงผลลัพธ์
              ได้แก่:
            </p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
              <li>
                <strong>ชื่อ (Name):</strong> ชื่อเล่นหรือนามแฝงที่ท่านระบุ
              </li>
              <li>
                <strong>ผลลัพธ์แบบประเมิน (Assessment Results):</strong>{" "}
                คะแนนจากแบบทดสอบ OCEAN (Openness, Conscientiousness,
                Extraversion, Agreeableness, Neuroticism) และคลาสตัวละคร (Mage,
                Paladin, Warrior, Cleric, Rogue)
              </li>
              <li>
                <strong>ข้อมูลการจัดทีม:</strong>{" "}
                ประวัติการสร้างทีมและการจับคู่ที่ท่านเป็นผู้สร้าง
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              2. การประมวลผลด้วย AI (Artificial Intelligence)
            </h2>
            <div className="bg-[var(--highlight)]/5 p-4 rounded-xl border border-[var(--highlight)]/10 text-[var(--foreground)] text-sm">
              <p>
                ⚠️ <strong>สำคัญ:</strong> ระบบมีการส่งข้อมูลของท่าน (ชื่อ,
                ผลคะแนนบุคลิกภาพ) ไปยังระบบ AI (Google Gemini)
                เพื่อทำการวิเคราะห์และสร้างคำแนะนำ
              </p>
            </div>
            <p className="mt-2">
              เราใช้ AI
              เพื่อสร้างความบันเทิงและให้มุมมองในการทำงานร่วมกันเท่านั้น
              ข้อมูลที่ส่งไปจะถูกใช้เพื่อการประมวลผล ณ ขณะนั้น
              และไม่ได้ถูกนำไปใช้ฝึก (Train) โมเดล AI ในภายหลัง
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              3. การเปิดเผยข้อมูล
            </h2>
            <p>
              ข้อมูล (ชื่อ, คลาส) ของท่าน <strong>จะถูกแสดงต่อสาธารณะ</strong>{" "}
              ภายในหน้าแรก และหน้า Team
              เพื่อให้เพื่อนร่วมทีมสามารถค้นหาและจับคู่กับท่านได้
              หากท่านไม่ต้องการเปิดเผยข้อมูล
              กรุณาแจ้งลบข้อมูลผ่านช่องทางการติดต่อ
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              4. การลบข้อมูล (Data Deletion)
            </h2>
            <p>
              หากท่านต้องการลบข้อมูลออกจากระบบ สามารถดำเนินการได้โดยการติดต่อเรา
              หรือกดปุ่มออกจากระบบ (Log Out)
              ซึ่งจะเป็นการลบข้อมูลการล็อกอินในเครื่องของท่าน
              (แต่ข้อมูลในฐานข้อมูล Database อาจยังคงอยู่จนกว่าจะมีการแจ้งลบ)
            </p>
          </section>

          <p className="text-sm text-[var(--muted)] mt-8 pt-4 border-t border-black/5 dark:border-white/5">
            ประกาศ ณ วันที่ 15/12/2025
          </p>
        </div>
      </div>
    </div>
  );
}
