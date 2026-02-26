import React from "react";
import { Scale } from "lucide-react";

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 font-[family-name:var(--font-line-seed)]">
      <div className="bg-[var(--background)]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm border border-black/5 dark:border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="w-fit p-3 bg-[var(--highlight)]/10 rounded-2xl text-[var(--highlight)]">
            <Scale size={32} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] leading-tight">
            ข้อตกลงการใช้งาน
          </h1>
        </div>

        <div className="space-y-6 text-[var(--foreground)] opacity-90 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              1. ข้อตกลงการใช้งาน
            </h2>
            <p>ในการใช้งานเว็บไซต์ Kemii ท่านตกลงที่จะปฏิบัติตามกฎดังนี้:</p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-2">
              <li>
                <strong>ห้ามใช้ถ้อยคำรุนแรง:</strong> ห้ามตั้งชื่อ (Name)
                หรือชื่อทีมที่หยาบคาย ส่อเสียด เหยียดเชื้อชาติ ศาสนา หรือเพศ
              </li>
              <li>
                <strong>ห้ามสแปม (No Spam):</strong> ห้ามกดสร้างข้อมูลขยะ
                หรือเจาะระบบเพื่อรบกวนการทำงานของเว็บไซต์
              </li>
              <li>
                <strong>ความถูกต้องของข้อมูล:</strong>{" "}
                ควรตอบแบบประเมินตามความเป็นจริงเพื่อให้ได้ผลลัพธ์ที่แม่นยำที่สุด
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              2. กฎกติกาการใช้งาน
            </h2>
            <p>
              เนื้อหา โค้ด การออกแบบ และโลโก้ทั้งหมดภายในเว็บไซต์
              เป็นลิขสิทธิ์ของผู้พัฒนา ห้ามมิให้ผู้ใดคัดลอก ดัดแปลง
              หรือนำไปใช้ในเชิงพาณิชย์โดยไม่ได้รับอนุญาต
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              3. ข้อจำกัดความรับผิดชอบ
            </h2>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-2">
              <li>
                <strong>ความแม่นยำ: </strong>
                ผลลัพธ์จากการวิเคราะห์มีวัตถุประสงค์เพื่อการศึกษาและพัฒนาทีมเท่านั้น
                ไม่สามารถรับรองความถูกต้องได้ 100%
              </li>
              <li>
                <strong>ความเสียหาย: </strong>
                ผู้พัฒนาจะไม่รับผิดชอบต่อความเสียหายใดๆ หรือการสูญหายของข้อมูล
                ที่เกิดจากเหตุสุดวิสัยหรือความผิดพลาดของระบบ
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              4. สิทธิ์ในการระงับการใช้งาน
            </h2>
            <p>
              ผู้ดูแลระบบขอสงวนสิทธิ์ในการลบข้อมูล (Delete) หรือแบนผู้ใช้งาน
              (Ban) ที่ละเมิดข้อตกลงข้างต้นโดยไม่ต้องแจ้งให้ทราบล่วงหน้า
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
              5. การเปลี่ยนแปลงข้อตกลง
            </h2>
            <p>
              เราอาจมีการปรับปรุงข้อตกลงการใช้งานตามความเหมาะสม
              การใช้งานเว็บไซต์อย่างต่อเนื่องถือว่าท่านยอมรับข้อตกลงที่เปลี่ยนแปลงไป
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
