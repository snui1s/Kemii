import { Code, Heart } from "lucide-react";

export default function Footer() {
  const APP_VERSION = "v1.1";

  return (
    <footer
      id="site-footer"
      // ✅ เพิ่ม dark:bg-slate-900, dark:border-slate-800, dark:text-slate-400
      className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 py-8 border-t border-slate-200 dark:border-slate-800 mt-auto transition-colors duration-300"
    >
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center md:text-left">
        {/* 1. Copyright & Version */}
        <div className="text-sm font-medium flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 md:justify-self-start">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()}</span>
            {/* ✅ ชื่อแบรนด์สีขาวในโหมดมืด */}
            <span className="text-slate-700 dark:text-slate-200 font-bold">
              Kemii
            </span>
          </div>

          <span className="text-slate-400 hidden md:inline">|</span>
          <span className="text-slate-500 dark:text-slate-500 text-xs">
            All rights reserved.
          </span>

          {/* ✅ Badge Version สีเข้มขึ้นในโหมดมืด */}
          <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono border border-transparent dark:border-slate-700">
            {APP_VERSION}
          </span>
        </div>

        {/* 2. Credits */}
        <div className="flex items-center justify-center gap-2 text-sm font-medium md:justify-self-center">
          <span>Built with</span>
          <Heart
            size={16}
            className="text-red-500 fill-red-500 animate-pulse"
          />
          <span>by</span>
          <a
            href="https://github.com/snailsqz"
            target="_blank"
            rel="noopener noreferrer"
            // ✅ ลิงก์สี Indigo สว่างขึ้นในโหมดมืด
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition font-bold border-b border-transparent hover:border-indigo-600 dark:hover:border-indigo-400"
          >
            Pawee & Apiwat
          </a>
        </div>

        {/* 3. GitHub Link */}
        <div className="flex justify-center md:justify-end md:justify-self-end animate-fade-in">
          <a
            href="https://github.com/snailsqz/Kemii"
            target="_blank"
            rel="noopener noreferrer"
            // ✅ Hover แล้วเป็นสีขาวในโหมดมืด
            className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition group"
          >
            <Code
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-sm font-semibold group-hover:underline decoration-slate-400 underline-offset-4">
              snailsqz/Kemii
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
