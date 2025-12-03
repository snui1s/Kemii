import { Code, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-100 text-slate-500 py-8 border-t border-slate-200 mt-auto">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center md:text-left">
        {/* 1. Copyright: เหลือแค่ชื่อโปรเจกต์ */}
        <div className="text-sm font-medium flex items-center justify-center md:justify-start gap-2 md:justify-self-start">
          <span>© {new Date().getFullYear()}</span>
          <span className="text-slate-700 font-bold">4Elements</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 text-xs">All rights reserved.</span>
        </div>

        {/* 2. Credits: ใส่ชื่อคุณคนเดียว */}
        <div className="flex items-center justify-center gap-2 text-sm font-medium md:justify-self-center">
          <span>Built with</span>
          <Heart
            size={16}
            className="text-red-500 fill-red-500 animate-pulse"
          />
          <span>by</span>
          <a
            href="https://github.com/snailsqz" // 🔗 ใส่ลิ้งก์ GitHub คุณตรงนี้
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 transition font-bold border-b border-transparent hover:border-indigo-600"
          >
            Pawee & Apiwat
          </a>
        </div>

        {/* 3. GitHub Link: โชว์ไอคอนพร้อมชื่อ */}
        <div className="flex justify-center md:justify-end md:justify-self-end animate-fade-in">
          <a
            href="https://github.com/snailsqz/4Elements" // 🔗 ใส่ลิ้งก์ GitHub คุณตรงนี้
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-slate-900 transition group"
          >
            <Code
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-sm font-semibold group-hover:underline decoration-slate-400 underline-offset-4">
              snailsqz/4Elements
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
