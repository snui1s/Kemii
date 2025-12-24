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

**Kemii** (Chemistry) is an AI-driven Guild Support System designed to address common workforce challenges such as skill-personality mismatch and suboptimal team dynamics. Unlike traditional management tools, Kemii integrates the **OCEAN Personality Model (Big 5)** utilizes **Google Gemini AI** to analyze user traits and algorithmically construct teams that achieve maximum compatibility and operational efficiency.

The system provides a holistic view of team composition, balancing technical skills with behavioral attributes to ensure sustainable high-performance collaboration.

## Key Features

### Personality & Role Classification

- **OCEAN Assessment**: Comprehensive psychometric evaluation covering Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.
- **AI Class Assignment**: Automated mapping of psychological profiles to functional RPG archetypes (Mage, Warrior, Paladin, Cleric, Rogue) to visualize core strengths and working styles.

### Quest Board & Intelligent Matching

- **Smart Board**: A dynamic quest interface displaying real-time "Harmony Scores" for potential team compositions.
- **Skill Gap Analysis**: Automated identification of missing technical competencies within a team, with AI-driven recommendations for suitable candidates.
- **Auto-Join Optimization**: Algorithmic probability assessment to suggest quests where the user's contribution maximizes success rates.

### Team Analytics & Management

- **Harmony Score**: A proprietary metric quantifying team cohesion based on interpersonal compatibility variance.
- **Skill Coverage**: Visual analytics demonstrating the team's fulfillment of mission-critical requirements.
- **Leader Control Center**: Administrative tools for team leaders to manage roster changes with AI-assisted decision support.

---

## Technology Stack

### Backend Infrastructure

- **Framework**: FastAPI (Python) - High-performance asynchronous API layer.
- **Database**: SQLite (SQLModel/SQLAlchemy) - Relational data persistence.
- **AI Engine**: Google Gemini Pro (via LangChain) - LLM for complex reasoning and analysis.
- **Algorithms**: Variance minimization logic and heuristic scoring models for team composition.

### Frontend Interface

- **Framework**: Next.js 14+ (App Router) - Server-side rendering and static generation.
- **Styling**: Tailwind CSS - Utility-first CSS for responsive design.
- **State Management**: React Hooks & Context API.
- **Visualization**: Recharts & Lucide React.

### DevOps

- **Containerization**: Docker & Docker Compose - consistent deployment environments.

---

## Installation & Setup

### Option 1: Docker (Recommended)

This method ensures all dependencies and services are configured automatically.

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/your-username/football-team-guild.git
    cd football-team-guild
    ```

2.  **Configure Environment**
    Create a `.env` file in the root directory and define your API key:

    ```env
    GOOGLE_API_KEY=your_gemini_api_key_here
    ```

3.  **Deploy Services**
    ```bash
    docker-compose up --build
    ```
    - **Frontend Application**: `http://localhost:3000`
    - **Backend API Docs**: `http://localhost:8000/docs`

---

### Option 2: Manual Installation (Development)

#### Backend Setup (Python)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies (using pip or uv)
pip install -r requirements.txt
# or
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
│   ├── quest_ai.py     # AI Logic & Matching Algorithms
│   └── scripts/        # Data Seeding & Utility Scripts
├── frontend/           # Next.js Web Application
│   ├── app/            # Page Routing & Layouts
│   └── components/     # Reusable UI Components
├── docker-compose.yml  # Container Orchestration Configuration
└── .env                # Environment Variables
```

---

<div align="center">
Developed by Kemii Team
</div>
