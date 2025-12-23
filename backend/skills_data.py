# Skills data for HR departments
# 13 departments × 10 skills = 130 total skills

DEPARTMENTS = [
    {
        "id": "swp_od",
        "name": "SWP & Organization Development",
        "skills": [
            "Organization Design",
            "Workforce Forecasting",
            "Strategic Planning",
            "Change Management",
            "Competency Modeling",
            "Manpower Budgeting",
            "Gap Analysis",
            "Culture Transformation",
            "Job Analysis & Job Description",
            "Organizational Effectiveness"
        ]
    },
    {
        "id": "hrbp",
        "name": "HR Business Partner (HRBP)",
        "skills": [
            "Strategic Partnering",
            "Stakeholder Management",
            "Performance Management",
            "Labor Law & Regulations",
            "Consulting Skills",
            "Business Acumen",
            "Conflict Resolution",
            "Headcount Planning",
            "Talent Review Facilitation",
            "Exit Interview Analysis"
        ]
    },
    {
        "id": "total_rewards",
        "name": "Total Rewards (Comp & Ben)",
        "skills": [
            "Payroll Management",
            "Salary Structure Design",
            "Job Grading (Hay/Mercer)",
            "Tax & Social Security",
            "Benefits Administration",
            "Compensation Benchmarking",
            "Annual Merit Planning",
            "Bonus Calculation",
            "Expat Compensation",
            "Insurance Renewal Negotiation"
        ]
    },
    {
        "id": "er",
        "name": "Employee Relations (ER)",
        "skills": [
            "Labor Law (Advanced)",
            "Disciplinary Action",
            "Union Management",
            "Employee Grievance Handling",
            "Investigation Techniques",
            "Labor Court Proceedings",
            "Welfare Committee Management",
            "Termination Process",
            "Employee Handbook Drafting",
            "Conflict Mediation"
        ]
    },
    {
        "id": "engagement",
        "name": "Employee Engagement & Internal Comm",
        "skills": [
            "Internal Communication Strategy",
            "Event Management (Townhall/Outing)",
            "Content Writing & Storytelling",
            "Graphic Design (Canva/Photoshop)",
            "Video Editing Basic",
            "Engagement Survey Design",
            "Crisis Communication",
            "Employer Branding",
            "CSR Activity Planning",
            "Social Media Management"
        ]
    },
    {
        "id": "talent_mgmt",
        "name": "Talent Management",
        "skills": [
            "Succession Planning",
            "High Potential (HiPo) Identification",
            "Career Path Design",
            "Assessment Center Design",
            "Leadership Development Program",
            "9-Box Grid Analysis",
            "Mentoring & Coaching Program",
            "Individual Development Plan (IDP)",
            "Talent Retention Strategy",
            "Skill Mapping"
        ]
    },
    {
        "id": "people_services",
        "name": "People Services (HR Ops)",
        "skills": [
            "Onboarding & Offboarding",
            "HRIS Administration",
            "Visa & Work Permit",
            "Document Management System",
            "SLA Management",
            "Time & Attendance Management",
            "Personal Data Maintenance",
            "Ticketing System (e.g., Zendesk)",
            "Employee Verification",
            "Vendor Management"
        ]
    },
    {
        "id": "compliance",
        "name": "HR Compliance & Assurance",
        "skills": [
            "PDPA / Data Privacy Law",
            "Internal Audit",
            "Risk Management",
            "Policy Writing & Review",
            "ISO Standards (HR)",
            "Code of Conduct Enforcement",
            "Background Check Process",
            "Health, Safety & Environment (HSE)",
            "Process Control",
            "SOP Development"
        ]
    },
    {
        "id": "l_and_d",
        "name": "Learning & Development (L&D)",
        "skills": [
            "Training Needs Analysis (TNA)",
            "Instructional Design",
            "Facilitation Skills",
            "LMS Administration",
            "Training Evaluation (ROI/Kirkpatrick)",
            "E-Learning Development",
            "Virtual Training Delivery",
            "Training Budget Management",
            "On-the-Job Training (OJT) Design",
            "Knowledge Management"
        ]
    },
    {
        "id": "hr_ai",
        "name": "HR AI & Automation",
        "skills": [
            "Python Programming",
            "Prompt Engineering",
            "Machine Learning Concepts",
            "RPA (Robotic Process Automation)",
            "API Integration",
            "Natural Language Processing (NLP)",
            "Data Cleaning & Preprocessing",
            "AI Ethics & Governance",
            "Chatbot Flow Design",
            "Automated Screening Tools"
        ]
    },
    {
        "id": "success_factors",
        "name": "HR SuccessFactors Specialist",
        "skills": [
            "SAP SuccessFactors Overview",
            "Employee Central (EC) Module",
            "Performance & Goals (PMGM)",
            "Recruiting Management (RCM)",
            "Learning Management (LMS)",
            "System Configuration",
            "Role-Based Permission (RBP)",
            "Integration Center",
            "UAT Planning & Execution",
            "Data Migration"
        ]
    },
    {
        "id": "hr_dashboards",
        "name": "HR Dashboards & Analytics",
        "skills": [
            "Power BI / Tableau",
            "SQL Querying",
            "Data Storytelling",
            "Excel VBA / Macros",
            "KPI Dashboard Design",
            "Statistical Analysis",
            "Database Management",
            "Google Looker Studio",
            "People Analytics Strategy",
            "Data Quality Management"
        ]
    },
    {
        "id": "project_manager",
        "name": "Project Manager",
        "skills": [
            "Agile & Scrum Methodology",
            "Waterfall / Traditional PM",
            "Project Planning (Gantt/Timeline)",
            "Risk Management",
            "Budget Tracking",
            "Resource Allocation",
            "Stakeholder Communication",
            "Jira / Asana / Trello",
            "Scope Management",
            "Meeting Facilitation"
        ]
    }
]


def get_all_skills():
    """Get a flat list of all skills across all departments"""
    all_skills = []
    for dept in DEPARTMENTS:
        all_skills.extend(dept["skills"])
    return all_skills
