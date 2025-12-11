import Link from "next/link";
import { Code } from "lucide-react";

export default function Footer() {
  const APP_VERSION = "v2.5";

  return (
    <footer
      id="site-footer"
      className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 py-8 sm:py-10 border-t border-slate-200 dark:border-slate-800 mt-auto transition-colors duration-300"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand & Version */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-800 dark:text-white">
                Kemii
              </span>
              <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono border border-transparent dark:border-slate-700">
                {APP_VERSION}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
              ค้นหาเคมีที่ลงตัว ปลดล็อกศักยภาพทีมด้วย AI
              เครื่องมือวิเคราะห์บุคลิกภาพที่ช่วยให้การทำงานร่วมกันง่ายขึ้น
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
              เมนูหลัก
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link
                  href="/assessment"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  ทำแบบประเมิน
                </Link>
              </li>
              <li>
                <Link
                  href="/team-history"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  ประวัติทีม
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
              กฎหมายและความเป็นส่วนตัว
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  นโยบายความเป็นส่วนตัว
                </Link>
              </li>
              <li>
                <Link
                  href="/disclaimer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  ข้อจำกัดความรับผิดชอบ
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  ข้อตกลงการใช้งาน
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
              ช่วยเหลือ
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  ติดต่อเรา
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/snailsqz/Kemii"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition group"
                >
                  <Code size={16} />
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-center sm:text-left">
            © {new Date().getFullYear()} Kemii Team Chemistry. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
