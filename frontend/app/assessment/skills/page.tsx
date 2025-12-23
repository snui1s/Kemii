import { Suspense } from "react";
import SkillsContent from "./_components/SkillsContent";

export default function SkillsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <SkillsContent />
    </Suspense>
  );
}
