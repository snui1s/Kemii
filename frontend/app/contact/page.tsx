import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 font-[family-name:var(--font-line-seed)]">
      <div className="bg-[var(--background)]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm border border-black/5 dark:border-white/5 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-4 leading-tight">
          ติดต่อเรา
        </h1>

        <p className="text-[var(--foreground)] opacity-80 mb-8 max-w-lg mx-auto text-sm sm:text-base">
          หากท่านมีข้อเสนอแนะ แจ้งปัญหาการใช้งาน
          หรือต้องการแจ้งลบข้อมูลส่วนบุคคล (PDPA)
          สามารถติดต่อทีมผู้พัฒนาได้ผ่านช่องทางดังนี้
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          <a
            href="mailto:p.indulakshana@gmail.com"
            className="flex flex-col items-center justify-center p-5 sm:p-6 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition border border-transparent hover:border-[var(--highlight)]/30 group"
          >
            <div className="p-3 bg-[var(--highlight)]/10 rounded-full text-[var(--highlight)] group-hover:scale-110 transition-transform">
              <Mail size={24} />
            </div>
            <span className="font-bold text-[var(--foreground)] mt-3">
              Email
            </span>
            <span className="text-xs sm:text-sm text-[var(--muted)] break-all px-2">
              p.indulakshana@gmail.com
            </span>
          </a>

          <a
            href="https://github.com/snailsqz/Kemii/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-5 sm:p-6 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition border border-transparent hover:border-[var(--highlight)]/30 group"
          >
            <div className="p-3 bg-black/10 dark:bg-white/10 rounded-full text-[var(--foreground)] group-hover:scale-110 transition-transform">
              <svg 
                viewBox="0 0 24 24" 
                width="24" 
                height="24" 
                stroke="currentColor" 
                strokeWidth="2" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </div>
            <span className="font-bold text-[var(--foreground)] mt-3">
              GitHub Issues
            </span>
            <span className="text-xs sm:text-sm text-[var(--muted)]">
              แจ้งบั๊ก / Request Feature
            </span>
          </a>
        </div>

        <div className="mt-10 pt-6 border-t border-black/5 dark:border-white/5">
          <p className="text-xs sm:text-sm text-[var(--muted)] px-2">
            สำหรับกรณีเร่งด่วนเกี่ยวกับข้อมูลส่วนบุคคล (PDPA)
            กรุณาระบุหัวข้ออีเมลว่า <span className="text-[var(--foreground)] font-medium">"[PDPA Request]"</span> เพื่อการดำเนินการที่รวดเร็ว
          </p>
        </div>
      </div>
    </div>
  );
}
