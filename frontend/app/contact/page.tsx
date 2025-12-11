import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
          ติดต่อเรา (Contact Us)
        </h1>

        <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-lg mx-auto">
          หากท่านมีข้อเสนอแนะ แจ้งปัญหาการใช้งาน
          หรือต้องการแจ้งลบข้อมูลส่วนบุคคล (PDPA)
          สามารถติดต่อทีมผู้พัฒนาได้ผ่านช่องทางดังนี้
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          <a
            href="mailto:p.indulakshana@gmail.com"
            className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition border border-slate-100 dark:border-slate-700 group"
          >
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Mail size={24} />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200 mt-3">
              Email
            </span>
            <span className="text-sm text-slate-500">
              p.indulakshana@gmail.com
            </span>
          </a>

          <a
            href="https://github.com/snailsqz/Kemii"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition border border-slate-100 dark:border-slate-700 group"
          >
            <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-700 dark:text-white group-hover:scale-110 transition-transform">
              <Image
                src="/Octicons-mark-github.svg"
                alt="GitHub"
                width={24}
                height={24}
                className="dark:invert"
              />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200 mt-3">
              GitHub Issues
            </span>
            <span className="text-sm text-slate-500">
              แจ้งบั๊ก / Request Feature
            </span>
          </a>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-400">
            สำหรับกรณีเร่งด่วนเกี่ยวกับข้อมูลส่วนบุคคล (PDPA)
            กรุณาระบุหัวข้ออีเมลว่า "[PDPA Request]" เพื่อการดำเนินการที่รวดเร็ว
          </p>
        </div>
      </div>
    </div>
  );
}
