from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import create_db_and_tables
# Updated imports for new structure
from api import users, quests, admin, team, auth
from dotenv import load_dotenv
import os

load_dotenv()

origins = [o.strip() for o in os.getenv("ORIGINS", "").split(",") if o.strip()]

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield
    
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.head("/")
def read_root():
    return {"status": "I am awake!", "service": "Kemii API"}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(quests.router)
app.include_router(team.router)
app.include_router(admin.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
