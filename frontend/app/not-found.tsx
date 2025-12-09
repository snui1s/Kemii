"use client";
import Link from "next/link";
import { MoveLeft, FlaskConical, Atom } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 p-4 transition-colors relative overflow-hidden">
      {/* --- Background Effect (ฟองอากาศลอยๆ) --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-32 h-32 bg-purple-300/20 dark:bg-purple-900/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[20%] right-[10%] w-40 h-40 bg-blue-300/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>

        {/* Floating Icons */}
        <FlaskConical
          className="absolute top-20 left-20 text-slate-400 dark:text-slate-500 rotate-12 opacity-50"
          size={64}
        />
        <Atom
          className="absolute bottom-20 right-20 text-slate-400 dark:text-slate-500 -rotate-12 opacity-50"
          size={80}
        />
      </div>

      {/* --- Content --- */}
      <div className="z-10 text-center flex flex-col items-center animate-fade-in-up">
        {/* 404 Element Cards */}
        <div className="flex gap-2 sm:gap-4 mb-8">
          {/* Card: 4 */}
          <ElementCard
            number="4"
            symbol="Err"
            name="Error"
            color="bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
          />

          {/* Card: 0 (ลูกแก้ว Void) */}
          <div className="w-20 h-24 sm:w-28 sm:h-36 flex items-center justify-center">
            <div className="relative w-16 h-16 sm:w-24 sm:h-24">
              <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 rounded-full animate-ping opacity-20"></div>
              <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800 rounded-full border-4 border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-inner">
                <span className="text-4xl sm:text-6xl font-black text-slate-300 dark:text-slate-600">
                  0
                </span>
              </div>
            </div>
          </div>

          {/* Card: 4 */}
          <ElementCard
            number="4"
            symbol="Nf"
            name="Not Found"
            color="bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
          />
        </div>

        {/* Text */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          การทดลองล้มเหลว!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
          ดูเหมือนคุณจะเผลอผสมสารเคมีผิดสูตร <br></br>
          หรือหลงเข้ามาในมิติที่ไม่มีอยู่จริง (Page Not Found)
        </p>

        {/* Button */}
        <Link
          href="/"
          className="group flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 hover:shadow-lg transition-all dark:hover:bg-indigo-500"
        >
          <MoveLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          กลับสู่ห้องแล็บ (Home)
        </Link>
      </div>
    </div>
  );
}

// Component ย่อย: การ์ดธาตุ
function ElementCard({
  number,
  symbol,
  name,
  color,
}: {
  number: string;
  symbol: string;
  name: string;
  color: string;
}) {
  return (
    <div
      className={`w-20 h-24 sm:w-28 sm:h-36 ${color} border-2 rounded-xl p-2 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-default`}
    >
      <span className="text-xs font-bold opacity-70">{number}</span>
      <div className="text-center font-black text-3xl sm:text-5xl tracking-tighter self-center">
        {symbol}
      </div>
      <span className="text-[10px] sm:text-xs font-medium text-center uppercase tracking-wide opacity-80">
        {name}
      </span>

      {/* Shine Effect */}
      <div className="absolute top-0 -left-full w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:left-full transition-all duration-700 ease-in-out"></div>
    </div>
  );
}
