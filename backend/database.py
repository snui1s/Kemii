# database.py
import os
from sqlmodel import SQLModel, Session, create_engine
from dotenv import load_dotenv

load_dotenv()

# Determine the base directory (where database.py is located)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = "elements.db"

# Check if DATABASE_URL is set in environment, else default to absolute path sqlite
env_db_url = os.environ.get("DATABASE_URL")

if env_db_url:
    DATABASE_URL = env_db_url
else:
    # Use absolute path for SQLite to avoid CWD issues
    db_path = os.path.join(BASE_DIR, DB_NAME)
    DATABASE_URL = f"sqlite:///{db_path}"

connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

# สร้าง Engine
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session