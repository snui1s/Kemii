"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";
import ElementalLoader from "./ElementalLoader";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define public routes that don't need authentication
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/portal",
    "/contact",
    "/privacy-policy",
    "/disclaimer",
    "/terms",
  ];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // If not loading and no user, and trying to access a non-public route
    if (!loading && !user && !isPublicRoute) {
      router.push("/login");
    }
  }, [user, loading, router, pathname, isPublicRoute]);

  // Show loader while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <ElementalLoader />
      </div>
    );
  }

  // If we are on a public route or the user is authenticated, render the children
  if (user || isPublicRoute) {
    return <>{children}</>;
  }

  // Fallback while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <ElementalLoader />
    </div>
  );
}
