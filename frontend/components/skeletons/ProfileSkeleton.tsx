export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-3 py-4 md:p-8 font-[family-name:var(--font-line-seed)] animate-pulse">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="h-8 md:h-10 bg-black/10 dark:bg-white/10 rounded w-48 lg:w-64"></div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-black/5 dark:bg-white/5 rounded-xl p-3 md:p-4 h-[88px] md:h-[104px]"></div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left: User Card + Info */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <div className="bg-black/5 dark:bg-white/5 rounded-xl md:rounded-2xl h-[340px] md:h-[400px]"></div>
            <div className="bg-black/5 dark:bg-white/5 rounded-xl md:rounded-2xl h-[160px] md:h-[180px]"></div>
          </div>
          
          {/* Right: Departments + RPG Status */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <div className="bg-black/5 dark:bg-white/5 rounded-xl md:rounded-2xl h-[120px] md:h-[140px]"></div>
            <div className="bg-black/5 dark:bg-white/5 rounded-xl md:rounded-2xl h-[380px] md:h-[420px]"></div>
          </div>
        </div>
        
        {/* Back Button */}
        <div className="mt-6 md:mt-8 flex justify-center">
          <div className="h-10 md:h-12 w-[140px] bg-black/5 dark:bg-white/5 rounded-lg md:rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
