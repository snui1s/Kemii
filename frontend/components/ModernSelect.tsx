"use client";
import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Check,
  Flame,
  Wind,
  Mountain,
  Droplet,
} from "lucide-react";

// ฟังก์ชันเลือกไอคอนตามธาตุ
const getElementIcon = (element: string) => {
  switch (element) {
    case "D":
      return <Flame size={18} className="text-red-500 fill-red-100" />;
    case "I":
      return <Wind size={18} className="text-yellow-500 fill-yellow-100" />;
    case "S":
      return <Mountain size={18} className="text-green-500 fill-green-100" />;
    case "C":
      return <Droplet size={18} className="text-blue-500 fill-blue-100" />;
    default:
      return null;
  }
};

interface Option {
  id: string | number;
  label: string;
  subLabel?: string;
  element?: string; // 👇 เพิ่ม field นี้รับค่าธาตุ (D, I, S, C)
}

interface ModernSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ModernSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(
    (opt) => String(opt.id) === String(value)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* 1. Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 bg-white text-left
          ${
            isOpen
              ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
              : "border-slate-200 hover:border-slate-300"
          }
        `}
      >
        <span
          className={
            selectedOption ? "text-slate-800 font-medium" : "text-slate-400"
          }
        >
          {selectedOption ? (
            <span className="flex items-center gap-3">
              {/* 👇 แสดงไอคอนธาตุที่เลือก */}
              {selectedOption.element && getElementIcon(selectedOption.element)}

              <span>
                {selectedOption.label}
                {selectedOption.subLabel && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                    {selectedOption.subLabel}
                  </span>
                )}
              </span>
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 2. Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl border border-slate-100 shadow-xl max-h-60 overflow-y-auto animate-fade-in-up p-1">
          {options.length > 0 ? (
            options.map((opt) => {
              const isSelected = String(opt.id) === String(value);
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(String(opt.id));
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                    ${
                      isSelected
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* 👇 แสดงไอคอนธาตุในลิสต์ */}
                    {opt.element && getElementIcon(opt.element)}
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-xs text-slate-400">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-blue-600" />}
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-slate-400 text-sm">
              ไม่มีข้อมูล
            </div>
          )}
        </div>
      )}
    </div>
  );
}
