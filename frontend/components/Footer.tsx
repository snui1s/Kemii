"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function Footer() {
  const APP_VERSION = "v0.4 Beta";
  const { user, logout } = useAuth();

  const toastCooldown = useRef(false);
  const handleProtectedLink = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault();

      if (toastCooldown.current) return;

      toastCooldown.current = true;
      setTimeout(() => {
        toastCooldown.current = false;
      }, 3000);

      toast.error("🔒 กรุณาทำพิธีปลุกพลังก่อนใช้งานครับ", {
        style: {
          background: "#334155",
          color: "#fff",
        },
        id: "assessment-error",
        duration: 3000,
      });
    }
  };

  return (
      <footer
      id="site-footer"
      className="bg-[var(--background)] text-[var(--muted)] py-8 sm:py-10 border-t border-black/5 dark:border-white/5 mt-auto transition-colors duration-300 backdrop-blur-sm"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand & Version */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[var(--foreground)]">
                Kemii
              </span>
              <span className="text-xs bg-black/5 dark:bg-white/10 text-[var(--muted)] px-2 py-0.5 rounded-full font-mono border border-transparent">
                {APP_VERSION}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed max-w-xs opacity-80">
              ค้นหาเคมีที่ลงตัว ปลดล็อกศักยภาพทีมด้วย AI
              เครื่องมือวิเคราะห์บุคลิกภาพที่ช่วยให้การทำงานร่วมกันง่ายขึ้น
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">
              เมนูหลัก
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-[var(--highlight)] transition-colors"
                >
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link
                  href="/quests"
                  onClick={(e) => handleProtectedLink(e, "/quests")}
                  className={`transition-colors ${
                    user
                      ? "hover:text-[var(--highlight)]"
                      : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <span>เควส</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/users"
                  onClick={(e) => handleProtectedLink(e, "/users")}
                  className={`transition-colors ${
                    user
                      ? "hover:text-[var(--highlight)]"
                      : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <span>สมาชิกกิลด์</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">
              กฎหมายและความเป็นส่วนตัว
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-[var(--highlight)] transition-colors"
                >
                  นโยบายความเป็นส่วนตัว
                </Link>
              </li>
              <li>
                <Link
                  href="/disclaimer"
                  className="hover:text-[var(--highlight)] transition-colors"
                >
                  ข้อจำกัดความรับผิดชอบ
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-[var(--highlight)] transition-colors"
                >
                  ข้อตกลงการใช้งาน
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">
              ช่วยเหลือ
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[var(--highlight)] transition-colors"
                >
                  ติดต่อเรา
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/snailsqz/Kemii"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[var(--highlight)] transition-colors group"
                >
                  <Image
                    src="/Octicons-mark-github.svg"
                    alt="GitHub"
                    width={24}
                    height={24}
                    className="dark:invert opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-center sm:text-left opacity-60">
            © {new Date().getFullYear()} Kemii Team Chemistry. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
