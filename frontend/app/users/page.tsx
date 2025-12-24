"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Wand,
  Shield,
  Sword,
  Heart,
  Skull,
  Star,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Skill {
  name: string;
  level: number;
}

interface User {
  id: number;
  name: string;
  character_class: string;
  level: number;
  ocean_openness: number;
  ocean_conscientiousness: number;
  ocean_extraversion: number;
  ocean_agreeableness: number;
  ocean_neuroticism: number;
  skills: Skill[];
  is_available: boolean;
}

const CLASS_ICONS: Record<string, React.ReactNode> = {
  Mage: <Wand size={16} />,
  Paladin: <Shield size={16} />,
  Warrior: <Sword size={16} />,
  Cleric: <Heart size={16} />,
  Rogue: <Skull size={16} />,
};

const CLASS_COLORS: Record<string, string> = {
  Mage: "from-purple-500 to-indigo-500",
  Paladin: "from-amber-500 to-yellow-500",
  Warrior: "from-red-500 to-orange-500",
  Cleric: "from-emerald-500 to-teal-500",
  Rogue: "from-slate-600 to-slate-800",
};

const DEPARTMENTS = [
  {
    id: "swp_od",
    name: "SWP & Organization Development",
    label: "SWP & OD",
    skills: [
      "Organization Design",
      "Workforce Forecasting",
      "Strategic Planning",
      "Change Management",
      "Competency Modeling",
      "Manpower Budgeting",
      "Gap Analysis",
      "Culture Transformation",
      "Job Analysis & Job Description",
      "Organizational Effectiveness",
    ],
  },
  {
    id: "hrbp",
    name: "HR Business Partner (HRBP)",
    label: "HRBP",
    skills: [
      "Strategic Partnering",
      "Stakeholder Management",
      "Performance Management",
      "Labor Law & Regulations",
      "Consulting Skills",
      "Business Acumen",
      "Conflict Resolution",
      "Headcount Planning",
      "Talent Review Facilitation",
      "Exit Interview Analysis",
    ],
  },
  {
    id: "total_rewards",
    name: "Total Rewards (Comp & Ben)",
    label: "Total Rewards",
    skills: [
      "Payroll Management",
      "Salary Structure Design",
      "Job Grading (Hay/Mercer)",
      "Tax & Social Security",
      "Benefits Administration",
      "Compensation Benchmarking",
      "Annual Merit Planning",
      "Bonus Calculation",
      "Expat Compensation",
      "Insurance Renewal Negotiation",
    ],
  },
  {
    id: "er",
    name: "Employee Relations (ER)",
    label: "ER",
    skills: [
      "Labor Law (Advanced)",
      "Disciplinary Action",
      "Union Management",
      "Employee Grievance Handling",
      "Investigation Techniques",
      "Labor Court Proceedings",
      "Welfare Committee Management",
      "Termination Process",
      "Employee Handbook Drafting",
      "Conflict Mediation",
    ],
  },
  {
    id: "engagement",
    name: "Employee Engagement & Internal Comm",
    label: "Engagement",
    skills: [
      "Internal Communication Strategy",
      "Event Management (Townhall/Outing)",
      "Content Writing & Storytelling",
      "Graphic Design (Canva/Photoshop)",
      "Video Editing Basic",
      "Engagement Survey Design",
      "Crisis Communication",
      "Employer Branding",
      "CSR Activity Planning",
      "Social Media Management",
    ],
  },
  {
    id: "talent_mgmt",
    name: "Talent Management",
    label: "Talent Mgmt",
    skills: [
      "Succession Planning",
      "High Potential (HiPo) Identification",
      "Career Path Design",
      "Assessment Center Design",
      "Leadership Development Program",
      "9-Box Grid Analysis",
      "Mentoring & Coaching Program",
      "Individual Development Plan (IDP)",
      "Talent Retention Strategy",
      "Skill Mapping",
    ],
  },
  {
    id: "people_services",
    name: "People Services (HR Ops)",
    label: "People Services",
    skills: [
      "Onboarding & Offboarding",
      "HRIS Administration",
      "Visa & Work Permit",
      "Document Management System",
      "SLA Management",
      "Time & Attendance Management",
      "Personal Data Maintenance",
      "Ticketing System (e.g., Zendesk)",
      "Employee Verification",
      "Vendor Management",
    ],
  },
  {
    id: "compliance",
    name: "HR Compliance & Assurance",
    label: "HR Compliance",
    skills: [
      "PDPA / Data Privacy Law",
      "Internal Audit",
      "Risk Management",
      "Policy Writing & Review",
      "ISO Standards (HR)",
      "Code of Conduct Enforcement",
      "Background Check Process",
      "Health, Safety & Environment (HSE)",
      "Process Control",
      "SOP Development",
    ],
  },
  {
    id: "l_and_d",
    name: "Learning & Development (L&D)",
    label: "L&D",
    skills: [
      "Training Needs Analysis (TNA)",
      "Instructional Design",
      "Facilitation Skills",
      "LMS Administration",
      "Training Evaluation (ROI/Kirkpatrick)",
      "E-Learning Development",
      "Virtual Training Delivery",
      "Training Budget Management",
      "On-the-Job Training (OJT) Design",
      "Knowledge Management",
    ],
  },
  {
    id: "hr_ai",
    name: "HR AI & Automation",
    label: "HR AI",
    skills: [
      "Python Programming",
      "Prompt Engineering",
      "Machine Learning Concepts",
      "RPA (Robotic Process Automation)",
      "API Integration",
      "Natural Language Processing (NLP)",
      "Data Cleaning & Preprocessing",
      "AI Ethics & Governance",
      "Chatbot Flow Design",
      "Automated Screening Tools",
    ],
  },
  {
    id: "success_factors",
    name: "HR SuccessFactors Specialist",
    label: "SuccessFactors",
    skills: [
      "SAP SuccessFactors Overview",
      "Employee Central (EC) Module",
      "Performance & Goals (PMGM)",
      "Recruiting Management (RCM)",
      "Learning Management (LMS)",
      "System Configuration",
      "Role-Based Permission (RBP)",
      "Integration Center",
      "UAT Planning & Execution",
      "Data Migration",
    ],
  },
  {
    id: "hr_dashboards",
    name: "HR Dashboards & Analytics",
    label: "HR Dashboards",
    skills: [
      "Power BI / Tableau",
      "SQL Querying",
      "Data Storytelling",
      "Excel VBA / Macros",
      "KPI Dashboard Design",
      "Statistical Analysis",
      "Database Management",
      "Google Looker Studio",
      "People Analytics Strategy",
      "Data Quality Management",
    ],
  },
  {
    id: "project_manager",
    name: "Project Manager",
    label: "Project Manager",
    skills: [
      "Agile & Scrum Methodology",
      "Waterfall / Traditional PM",
      "Project Planning (Gantt/Timeline)",
      "Risk Management",
      "Budget Tracking",
      "Resource Allocation",
      "Stakeholder Communication",
      "Jira / Asana / Trello",
      "Scope Management",
      "Meeting Facilitation",
    ],
  },
];

function UserCard({ user }: { user: User }) {
  // Determine Departments
  const userDepts = Array.from(
    new Set(
      user.skills
        .map((s) => {
          // Find which dept this skill belongs to
          const found = DEPARTMENTS.find((d) => d.skills.includes(s.name));
          if (found) return found.label;

          // Also check if the skill name IS the department name
          const isDept = DEPARTMENTS.find((d) => d.name === s.name);
          if (isDept) return isDept.label;

          return null;
        })
        .filter(Boolean)
    )
  );

  // If no dept found (custom skills), fall back or show nothing?
  // User said "remove skills", so we only show depts.

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${
            CLASS_COLORS[user.character_class] || "from-slate-400 to-slate-500"
          } flex items-center justify-center text-white shadow-sm`}
        >
          {CLASS_ICONS[user.character_class] || <Star size={20} />}
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 dark:text-white text-base">
            {user.name}
          </p>
          <p className="text-sm text-slate-500">
            {user.character_class} • Lv.{user.level}
          </p>
        </div>
      </div>

      {/* OCEAN */}
      <div className="mb-4 p-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700/50">
        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
          OCEAN Score
        </p>
        <div className="flex justify-between items-center text-xs">
          <div className="flex flex-col items-center">
            <span className="text-purple-600 font-bold">
              {user.ocean_openness}
            </span>
            <span className="text-[9px] text-slate-400">O</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-blue-600 font-bold">
              {user.ocean_conscientiousness}
            </span>
            <span className="text-[9px] text-slate-400">C</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-amber-600 font-bold">
              {user.ocean_extraversion}
            </span>
            <span className="text-[9px] text-slate-400">E</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-emerald-600 font-bold">
              {user.ocean_agreeableness}
            </span>
            <span className="text-[9px] text-slate-400">A</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-rose-600 font-bold">
              {user.ocean_neuroticism}
            </span>
            <span className="text-[9px] text-slate-400">N</span>
          </div>
        </div>
      </div>

      {/* Departments (Replaces Skills) */}
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
          Departments
        </p>
        <div className="flex flex-wrap gap-1.5">
          {userDepts.length > 0 ? (
            userDepts.map((dept, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
              >
                {dept}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">
              No specific department
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  useEffect(() => {
    axios
      .get(`${API_URL}/users`)
      .then((res) => {
        const parsed = res.data.map((u: any) => ({
          ...u,
          skills:
            typeof u.skills === "string"
              ? JSON.parse(u.skills)
              : u.skills || [],
        }));
        setUsers(parsed);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name
      .toLowerCase()
      .includes(search.toLowerCase());

    let matchesDept = true;
    if (deptFilter !== "all") {
      const targetDept = DEPARTMENTS.find((d) => d.id === deptFilter);
      if (targetDept) {
        // Check if user has this department directly (new logic) or has a skill in it (legacy)
        matchesDept = user.skills.some(
          (s) =>
            s.name === targetDept.name || targetDept.skills.includes(s.name)
        );
      }
    }

    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/20 dark:bg-slate-900/20 px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="text-indigo-500" />
            รายชื่อพนักงาน
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            ดูข้อมูล Skills และ OCEAN ของทุกคน
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department Dropdown */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:border-indigo-500 min-w-[180px]"
          >
            <option value="all">ทั้งหมด</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="mb-4 text-sm text-slate-500">
          แสดง {filteredUsers.length} จาก {users.length} คน
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Users className="mx-auto mb-2" size={40} />
            <p>ไม่พบข้อมูล</p>
          </div>
        )}
      </div>
    </div>
  );
}
