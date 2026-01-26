"use client";

export default function ThemeBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Light Mode Ambient - Subtle Warmth */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[var(--zen-sand)]/20 rounded-full blur-[100px] dark:opacity-0 transition-opacity duration-700" />
      
      {/* Dark Mode Ambient - Subtle Depth */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[var(--zen-charcoal)]/50 rounded-full blur-[100px] opacity-0 dark:opacity-100 transition-opacity duration-700" />
      
      {/* Zen Highlight (Subtle Orange Accent) */}
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[var(--zen-orange)]/5 rounded-full blur-[120px]" />
    </div>
  );
}
