export interface Department {
  id: string;
  name: string;
  label?: string;
  skills?: string[];
}

export const DEPARTMENTS: Department[] = [
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

/**
 * Checks if a user's skill matches a target department.
 * Matches against:
 * 1. Department Name (case-insensitive)
 * 2. Department Label (case-insensitive, if exists)
 * 3. Department's Skill list (case-insensitive)
 */
export function matchesDepartment(
  skillName: string | undefined | null,
  dept: Department
): boolean {
  if (!skillName) return false;
  const normalizedSkill = skillName.toLowerCase().trim();

  // Check Name
  if (normalizedSkill === dept.name.toLowerCase().trim()) return true;

  // Check Label
  if (dept.label && normalizedSkill === dept.label.toLowerCase().trim()) {
    return true;
  }

  // Check Sub-skills
  if (
    dept.skills &&
    dept.skills.some((dS) => dS.toLowerCase().trim() === normalizedSkill)
  ) {
    return true;
  }

  return false;
}
