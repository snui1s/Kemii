export default function QuestCardSkeleton() {
  return (
    <div className="bg-white/30 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 p-6 flex flex-col animate-pulse h-[240px] backdrop-blur-sm">
      {/* Title & Status */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1 space-y-3 pr-4">
          <div className="h-6 bg-black/10 dark:bg-white/10 rounded-md w-[80%]"></div>
          <div className="h-3 bg-black/10 dark:bg-white/10 rounded-md w-full"></div>
          <div className="h-3 bg-black/10 dark:bg-white/10 rounded-md w-[60%]"></div>
        </div>
        <div className="h-6 w-16 bg-black/10 dark:bg-white/10 rounded-md shrink-0"></div>
      </div>
      
      {/* Roles & Info */}
      <div className="flex-1 space-y-5 mt-2">
        <div className="space-y-2">
          <div className="h-3 bg-black/10 dark:bg-white/10 rounded-md w-24"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-black/10 dark:bg-white/10 rounded-md w-[64px]"></div>
            <div className="h-6 bg-black/10 dark:bg-white/10 rounded-md w-[76px]"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/10"></div>
          <div className="space-y-1.5">
            <div className="h-3 bg-black/10 dark:bg-white/10 rounded-md w-20"></div>
            <div className="h-2.5 bg-black/10 dark:bg-white/10 rounded-md w-12"></div>
          </div>
        </div>
        <div className="h-7 bg-black/10 dark:bg-white/10 rounded-lg w-[60px]"></div>
      </div>
    </div>
  );
}
