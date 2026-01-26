export default function ResultSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      {/* ปุ่มย้อนกลับ */}
      <div className="h-6 w-24 bg-black/10 dark:bg-white/10 rounded mb-6"></div>

      {/* Header Card (กล่องใหญ่ด้านบน) */}
      <div className="relative p-5 sm:p-8 rounded-2xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 mb-6 flex flex-col items-center">
        <div className="w-16 h-16 bg-black/10 dark:bg-white/10 rounded-full mb-4"></div>
        <div className="h-8 w-48 bg-black/10 dark:bg-white/10 rounded mb-2"></div>
        <div className="h-6 w-32 bg-black/10 dark:bg-white/10 rounded mb-4"></div>
        <div className="h-6 w-24 bg-black/10 dark:bg-white/10 rounded-full"></div>
      </div>

      {/* Graph Area */}
      <div className="mb-8 w-full h-[400px] bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5"></div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Column 1 */}
        <div className="space-y-6">
          <div className="h-40 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5"></div>
          <div className="h-60 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5"></div>
        </div>

        {/* Column 2 */}
        <div className="space-y-6">
          <div className="h-32 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5"></div>
          <div className="h-48 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5"></div>
        </div>
      </div>

      {/* Footer Card */}
      <div className="mt-6 h-32 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5"></div>
    </div>
  );
}
