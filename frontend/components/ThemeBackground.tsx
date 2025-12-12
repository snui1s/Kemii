"use client";

export default function ThemeBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-700">
      <div className="absolute inset-0 bg-slate-50 dark:opacity-0 transition-opacity duration-700">
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: "radial-gradient(#475569 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* แสงแดดส่องมุมขวาบน */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-200/20 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] bg-blue-200/20 rounded-full blur-[80px]" />
      </div>

      {/* =========================================
          🌙 DARK MODE: Dangerous Dungeon 
      ========================================= */}
      <div className="absolute inset-0 bg-slate-950 opacity-0 dark:opacity-100 transition-opacity duration-700">
        {/* หมอกควันสีม่วง/น้ำเงิน */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-900/10 rounded-full blur-[120px]" />

        {/* 👿 MONSTER EYES (ใช้ CSS สร้างตาแดงๆ) */}

        {/* Monster 1: ซ้ายบน (กระพริบช้า) */}
        <div className="absolute top-[15%] left-[10%] animate-pulse duration-[4000ms]">
          <div className="flex gap-4">
            <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red]"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red]"></div>
          </div>
        </div>

        {/* Monster 2: ขวากลาง (หายตัวไปมา) */}
        <div className="absolute top-[40%] right-[15%] animate-[bounce_3s_infinite] opacity-60">
          <div className="flex gap-3 rotate-3">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_8px_yellow]"></div>
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_8px_yellow]"></div>
          </div>
        </div>

        {/* Monster 3: ล่างซ้าย (ตาใหญ่ น่ากลัว) */}
        <div className="absolute bottom-[20%] left-[20%] animate-pulse duration-[2000ms] delay-1000">
          <div className="flex gap-6 -rotate-6 opacity-30">
            <div className="w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_15px_purple]"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_15px_purple]"></div>
          </div>
        </div>

        {/* Monster 4: แอบมองหลัง Navbar (บนขวา) */}
        <div className="absolute top-[5%] right-[25%] opacity-40 animate-pulse duration-[5000ms]">
          <div className="flex gap-2">
            <div className="w-1 h-1 bg-green-400 rounded-full shadow-[0_0_5px_green]"></div>
            <div className="w-1 h-1 bg-green-400 rounded-full shadow-[0_0_5px_green]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
