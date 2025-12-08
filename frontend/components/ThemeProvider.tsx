"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// 👇 วิธีดึง Type ที่ถูกต้อง: ดึง props ทั้งหมดของ NextThemesProvider มาใช้เลย
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
