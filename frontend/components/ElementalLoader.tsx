import { Compass } from "lucide-react";

export default function ElementalLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in bg-[var(--background)]/80 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/5 shadow-lg max-w-[280px] mx-auto">
      <div className="relative flex items-center justify-center">
        {/* Subtle Pulse Ring */}
        <div className="absolute inset-0 rounded-full bg-[var(--highlight)] opacity-20 animate-ping duration-[2000ms]"></div>
        
        {/* Minimal Icon */}
        <div className="relative z-10 p-3 bg-[var(--background)] rounded-full border border-[var(--highlight)] text-[var(--highlight)] shadow-sm">
          <Compass size={32} className="animate-[spin_3s_ease-in-out_infinite]" strokeWidth={1.5} />
        </div>
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-sm font-semibold text-[var(--foreground)] animate-pulse">
          กำลังดาวน์โหลดข้อมูล...
        </h3>
        <p className="text-[10px] text-[var(--muted)] opacity-80 font-mono tracking-wider">
          PLEASE WAIT
        </p>
      </div>
    </div>
  );
}
