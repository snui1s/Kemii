# Guild AI Support System (Kemii)

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14.0%2B-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Intelligent Guild Management and Team Optimization System**
_Psychometric Analysis (OCEAN Model) | Quest Matching | Team Harmony Optimization_

</div>

---

## Project Overview

**Kemii** (Chemistry) is an AI-driven Guild Support System designed to address common workforce challenges such as skill-personality mismatch and suboptimal team dynamics. Unlike traditional management tools, Kemii integrates the **OCEAN Personality Model (Big 5)** and utilizes **Google Gemini AI** to analyze user traits and algorithmically construct teams that achieve maximum compatibility and operational efficiency.

The system provides a holistic view of team composition, balancing technical skills with behavioral attributes to ensure sustainable high-performance collaboration.

## Key Features

### ⚔️ Personality & Role Classification

- **OCEAN Assessment**: Comprehensive psychometric evaluation covering Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.
- **AI Class Assignment**: Automated mapping of psychological profiles to functional RPG archetypes (Mage, Warrior, Paladin, Cleric, Rogue).

### 🛡️ Team Quest (Intelligent Party Builder)

- **Team Composition AI**: Algorithms that suggest the best candidates based on required roles, skills, and availability.
- **Harmony Score**: Real-time prediction of team chemistry and success probability.
- **Availability Tracking**: filters out users who are currently busy or assigned to other quests.

### 🔐 Authentication & Security

- **Secure Login**: JWT-based authentication with auto-refresh mechanisms.
- **Remember Me**: Option to stay logged in via persistent storage (Local Storage) or temporary session (Session Storage).
- **Configurable Expiration**: Admin-controlled session timeouts via environment variables.

---

## Technology Stack

### Backend Infrastructure

- **Framework**: FastAPI (Python) - High-performance asynchronous API layer.
- **Database**: SQLite (SQLModel/SQLAlchemy) - Relational data persistence with automatic fallback.
- **AI Engine**: Google Gemini Pro (via LangChain) - LLM for complex reasoning and analysis.
- **Algorithms**: Variance minimization logic and heuristic scoring models for team composition.

### Frontend Interface

- **Framework**: Next.js 14+ (App Router) - Server-side rendering and static generation.
- **UI Components**: **Radix UI Primitives** (Accessible, unstyled components) styled with **Tailwind CSS**.
- **State Management**: React Query (TanStack Query) & Context API.
- **Visualization**: Recharts & Lucide React.

### DevOps

- **Containerization**: Docker & Docker Compose - consistent deployment environments.

---

## Installation & Setup

### ⚙️ Backend Configuration (Critical)

You must create a `.env` file in the `backend/` directory to run the server securely.

**File:** `backend/.env`

```env
# Security Keys (Generate random strings for production)
SECRET_KEY="your_super_secret_random_key_here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 1440 mins = 1 Day

# Database (Optional - Defaults to local SQLite if empty)
# DATABASE_URL="postgresql://user:password@localhost/dbname"
```

### Option 1: Docker (Recommended)

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/snui1s/Kemii.git
    cd Kemii
    ```

2.  **Configure Environment**
    Create a `.env` in the root (for docker) and `backend/.env` (for python app).

3.  **Deploy Services**
    ```bash
    docker-compose up --build
    ```
    - **Frontend Application**: `http://localhost:3000`
    - **Backend API Docs**: `http://localhost:8000/docs`

### Option 2: Manual Installation (Development)

#### Backend Setup (Python)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
# or with uv
uv pip install -r requirements.txt

# Start the server
python main.py
```

#### Frontend Setup (Node.js)

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
├── backend/            # Python FastAPI Service
│   ├── main.py         # Application Entry & API Routes
│   ├── models.py       # SQLModel Database Schemas
│   ├── auth.py         # Authentication Logic & JWT
│   ├── .env            # Backend Config (Secrets)
│   ├── routers/        # API Endpoints (quests, users, auth, teams)
│   ├── services/       # Business Logic (AI, Matching)
│   └── scripts/        # Data Seeding & Utility Scripts
├── frontend/           # Next.js Web Application
│   ├── app/            # Page Routing & Layouts
│   ├── components/     # Reusable UI Components (Radix UI)
│   ├── context/        # Auth & App State
│   └── lib/            # Utilities
├── docker-compose.yml  # Container Orchestration Configuration
└── README.md           # Documentation
```

---

<div align="center">
Developed by Kemii Team
</div>
