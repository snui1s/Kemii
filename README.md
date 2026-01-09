# Kemii: Intelligent Guild Support System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.0%2B-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.0%2B-f9f9f9?style=for-the-badge&logo=bun&logoColor=black)
![UV](https://img.shields.io/badge/UV-Package--Manager-orange?style=for-the-badge)

**Next-Gen Team Optimization and Personality-Driven Quest Matching**
_Powered by the Kemii Golden Formula and Google Gemini AI_

</div>

---

## Project Overview

Kemii (Chemistry) is a sophisticated AI-driven Guild Support System designed to solve the human element challenges in professional and collaborative environments. By integrating the OCEAN Personality Model (Big 5) and the proprietary Kemii Golden Formula, the system analyzes individual traits to build world-class teams with maximum harmony and operational efficiency.

The system gamifies team management by mapping real-world psychological profiles to functional RPG-inspired archetypes, ensuring that every project (Quest) has the perfect balance of roles and personalities.

## Key Features

### Personality-Based Class System

- OCEAN Assessment: In-depth psychometric testing covering Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.
- AI Class Mapping: Automatic assignment to character classes (Mage, Warrior, Paladin, Cleric, Rogue) based on psychological data.
- Novice Restriction: Secure tiering system that restricts full guild access until the assessment ritual is completed.

### Intelligent Party Builder (Quest System)

- Kemii Golden Formula: Specialized algorithm for calculating optimal team composition by balancing technical skills and personality harmony.
- Quest-Specific Requirements: Configurable class needs for each quest types.
- Harmony Score: Predictive analysis of team success probability and potential interpersonal friction.

### Premium Responsive Experience

- Adaptive UI: Fully optimized for mobile (375px+) with card-based layouts and intuitive touch controls.
- Interactive Inputs: Custom quantity toggle buttons and modern design system for an immersive experience.

### Security and Role Management

- JWT Authentication: Secure token-based access with auto-refresh capabilities.
- Role-Based Access Control: Granular management of profile visibility and internal system interactions.

---

## Technology Stack

### Backend

- Framework: FastAPI (Python)
- Package Manager: UV
- Database: SQLite with SQLModel (SQLAlchemy)
- AI Engine: Google Gemini AI

### Frontend

- Framework: Next.js 15 (App Router)
- Runtime: Bun
- Styling: Tailwind CSS
- State Management: TanStack Query (React Query) and Context API

---

## Configuration Details

### Backend Environment Variables (backend/.env)

Create a `.env` file in the `backend/` directory with the following variables:

| Variable                    | Description                                     | Example                 |
| :-------------------------- | :---------------------------------------------- | :---------------------- |
| SECRET_KEY                  | Random string for JWT encryption                | `your-secret-key-here`  |
| ALGORITHM                   | Hashing algorithm for tokens                    | `HS256`                 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token validity duration in minutes              | `1440`                  |
| GOOGLE_API_KEY              | API key for Google Gemini AI services (Crucial) | `AIzaSy...`             |
| ORIGINS                     | Allowed CORS origins (comma-separated)          | `http://localhost:3000` |

### Frontend Environment Variables (frontend/.env)

Create a `.env` file in the `frontend/` directory with the following variables:

| Variable            | Description                         | Example                 |
| :------------------ | :---------------------------------- | :---------------------- |
| NEXT_PUBLIC_API_URL | Full URL of the backend API service | `http://localhost:8000` |

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/snailsqz/Kemii.git
cd Kemii
```

### 2. Backend Setup

```bash
cd backend
# Install dependencies and sync environment
uv sync

# Start the server
uv run main.py
```

### 3. Frontend Setup

```bash
cd frontend
# Install dependencies
bun install

# Start development server
bun run dev
```

---

## Project Structure

```
root/
├── backend/            # FastAPI Service
│   ├── api/            # Route Handlers (quests, users, auth, team)
│   ├── services/       # Core Logic (AI Service, Kemii Golden Formula)
│   ├── schemas/        # Pydantic Data Models
│   ├── models/         # SQLModel Database Tables
│   ├── tests/          # Pytest Suite
│   └── main.py         # Entry Point
├── frontend/           # Next.js Application
│   ├── app/            # Pages and Routing
│   ├── components/     # UI Library
│   ├── context/        # Global State Management
│   └── lib/            # Utilities
└── docker-compose.yml  # Containerization Config
```

---

<div align="center">
Developed by Kemii Team
</div>
