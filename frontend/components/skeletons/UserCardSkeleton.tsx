export default function UserCardSkeleton() {
  return (
    <div className="w-full h-full border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden bg-white/30 dark:bg-white/5 backdrop-blur-sm animate-pulse">
      <div className="p-5 flex flex-col sm:flex-row items-start gap-4 h-full">
        {/* Icon Skeleton */}
        <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-black/10 dark:bg-white/10" />

        {/* Content Skeleton */}
        <div className="flex-1 w-full flex flex-col justify-between h-full space-y-3">
          {/* Header Row */}
          <div>
            <div className="h-5 md:h-6 bg-black/10 dark:bg-white/10 rounded-md w-3/4 mb-2" />
            <div className="flex gap-2">
              <div className="h-3 w-8 bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-3 w-16 bg-black/10 dark:bg-white/10 rounded" />
            </div>
          </div>

          {/* Departments Skeleton */}
          <div className="flex gap-1.5 py-1">
            <div className="h-5 w-16 bg-black/10 dark:bg-white/10 rounded-md" />
            <div className="h-5 w-20 bg-black/10 dark:bg-white/10 rounded-md" />
          </div>

          {/* Stats Bar Skeleton */}
          <div className="flex gap-3 pt-1">
            <div className="flex flex-col gap-1 w-14">
              <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-[3px] w-full bg-black/10 dark:bg-white/10 rounded-full" />
            </div>
            <div className="flex flex-col gap-1 w-14">
              <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-[3px] w-full bg-black/10 dark:bg-white/10 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
