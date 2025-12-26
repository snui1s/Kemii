# database.py
import os
from sqlmodel import SQLModel, Session, create_engine
from dotenv import load_dotenv

load_dotenv()

# Determine the base directory (where database.py is located)
# We want to store data in backend/data/elements.db
# database.py is in backend/core/
# So we go up one level to backend, then into data
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_NAME = "elements.db"

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Check if DATABASE_URL is set in environment, else default to absolute path sqlite
env_db_url = os.environ.get("DATABASE_URL")

if env_db_url:
    DATABASE_URL = env_db_url
else:
    # Use absolute path for SQLite to avoid CWD issues
    db_path = os.path.join(DATA_DIR, DB_NAME)
    DATABASE_URL = f"sqlite:///{db_path}"

connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

# Create Engine
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
