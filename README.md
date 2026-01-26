# Kemii: Intelligent Guild Support System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.0%2B-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)

**Next-Gen Team Optimization and Personality-Driven Quest Matching**
_Powered by the Kemii Golden Formula and Google Gemini AI_

</div>

---

## Project Overview

**Kemii** (Chemistry) is a sophisticated AI-driven Guild Support System designed to gamify and optimize team dynamics in professional environments. By integrating the **OCEAN Personality Model (Big 5)** with RPG archetypes, Kemii transforms abstract psychological data into actionable "Guild Classes" (Mage, Warrior, Paladin, etc.), making team management engaging and data-driven.

At its core lies the **Kemii Golden Formula**, a proprietary algorithm that minimizes interpersonal friction while maximizing skill coverage, ensuring every "Party" (Team) is balanced for success.

## Key Features

### Advanced AI & Psychology

- **Generative AI Personas**: Features a distinct "Guild Strategist" AI that acts as a Career Coach and Team Tactician, providing localized (Thai) insights with a consistent RPG-Professional tone.
- **OCEAN Psychometric Assessment**: A 50-question interactive ritual to determine a user's Big 5 stats.
- **Dynamic Class Mapping**: AUTOMATICALLY assigns RPG classes based on personality traits (e.g., High Openness -> Mage, High Conscientiousness -> Paladin).

### Intelligent Party Builder (Matching Engine)

- **The Kemii Golden Formula**: A cost-function algorithm that optimizes for:
  - **Skill Coverage**: Fills "Skill Gaps" dynamically.
  - **Personality Harmony**: Minimizes variance in key traits (C, A) to ensure work-style compatibility.
  - **Neuroticism Penalty**: penalizes high team stress levels.
- **Dynamic Gap Scoring**: The system recalculates the "best next candidate" in real-time based on who is already in the team, evolving its recommendations as the party grows.

### Zen Minimal UI / UX

- **Glassmorphism Design System**: A premium, "Zen Minimal" aesthetic using Tailwind CSS, featuring extensive `backdrop-blur`, subtle gradients, and a soothing color palette.
- **Interactive Animations**: Custom CSS animations including "Meteor Showers" (Mage), "Holy Beams" (Paladin), and floating particles for a living, breathing interface.
- **Mobile-First Experience**: Fully responsive layout optimized for touch devices (375px+).

### Security & Architecture

- **JWT Authentication**: Secure, stateless authentication with auto-refresh mechanisms.
- **Role-Based Access Control (RBAC)**: Distinguishes between Guild Members and Admins.
- **Middleware Security**: `AuthGuard` implementation on both Frontend (HOC) and Backend (Dependency Injection).

---

## Technology Stack

### Backend Service

- **Core**: Python 3.10+, FastAPI
- **AI**: LangChain + Google Gemini Pro
- **Math**: NumPy (for vector calculations in matching)
- **Database**: SQLite (Dev) / PostgreSQL (Prod ready via SQLModel)
- **Package Manager**: UV (Ultra-fast Python package installer)

### Frontend Application

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **State**: TanStack Query (React Query) + Context API
- **Styling**: Tailwind CSS + Lucide React
- **Runtime**: Bun

---

## Configuration

### Backend (`backend/.env`)

```env
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GOOGLE_API_KEY=your_gemini_api_key
ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Installation

### 1. Clone & Prepare

```bash
git clone https://github.com/snailsqz/Kemii.git
cd Kemii
```

### 2. Backend (FastAPI)

```bash
cd backend
# Install dependencies with UV (Recommended) or pip
uv sync
# OR
pip install -r requirements.txt

# Run Server
uv run main.py
```

### 3. Frontend (Next.js)

```bash
cd frontend
# Install with Bun
bun install

# Run Dev Server
bun run dev
```

---

## Project Structure

```bash
root/
├── backend/
│   ├── services/       # AI & Matching Logic (The Brains)
│   │   ├── ai.py       # LangChain + Gemini Integration
│   │   └── matching.py # Golden Formula Implementation
│   ├── api/            # REST Endpoints
│   └── core/           # Config & Security
├── frontend/
│   ├── app/            # Next.js App Router Pages
│   ├── components/     # Reusable UI Components
│   └── lib/            # API & Utils
└── README.md
```

---

<div align="center">
<b>MIT License</b>
</div>
