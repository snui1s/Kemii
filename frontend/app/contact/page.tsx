import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 font-[family-name:var(--font-line-seed)]">
      <div className="bg-[var(--background)]/80 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-black/5 dark:border-white/5 text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-6">
          ติดต่อเรา (Contact Us)
        </h1>

        <p className="text-[var(--foreground)] opacity-80 mb-8 max-w-lg mx-auto">
          หากท่านมีข้อเสนอแนะ แจ้งปัญหาการใช้งาน
          หรือต้องการแจ้งลบข้อมูลส่วนบุคคล (PDPA)
          สามารถติดต่อทีมผู้พัฒนาได้ผ่านช่องทางดังนี้
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          <a
            href="mailto:p.indulakshana@gmail.com"
            className="flex flex-col items-center justify-center p-6 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition border border-transparent hover:border-[var(--highlight)]/30 group"
          >
            <div className="p-3 bg-[var(--highlight)]/10 rounded-full text-[var(--highlight)] group-hover:scale-110 transition-transform">
              <Mail size={24} />
            </div>
            <span className="font-bold text-[var(--foreground)] mt-3">
              Email
            </span>
            <span className="text-sm text-[var(--muted)]">
              p.indulakshana@gmail.com
            </span>
          </a>

          <a
            href="https://github.com/snailsqz/Kemii/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-6 bg-black/5 dark:bg-white/5 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition border border-transparent hover:border-[var(--highlight)]/30 group"
          >
            <div className="p-3 bg-black/10 dark:bg-white/10 rounded-full text-[var(--foreground)] group-hover:scale-110 transition-transform">
              <Image
                src="/Octicons-mark-github.svg"
                alt="GitHub"
                width={24}
                height={24}
                className="dark:invert"
              />
            </div>
            <span className="font-bold text-[var(--foreground)] mt-3">
              GitHub Issues
            </span>
            <span className="text-sm text-[var(--muted)]">
              แจ้งบั๊ก / Request Feature
            </span>
          </a>
        </div>

        <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/5">
          <p className="text-sm text-[var(--muted)]">
            สำหรับกรณีเร่งด่วนเกี่ยวกับข้อมูลส่วนบุคคล (PDPA)
            กรุณาระบุหัวข้ออีเมลว่า "[PDPA Request]" เพื่อการดำเนินการที่รวดเร็ว
          </p>
        </div>
      </div>
    </div>
  );
}
