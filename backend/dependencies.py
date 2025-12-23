import os
from datetime import datetime
from sqlmodel import Session, select
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from models import User

load_dotenv()

# --- AI CONFIG ---
if not os.getenv("GOOGLE_API_KEY"):
    print("GOOGLE_API_KEY not found in .env")

# ใช้ Gemini Flash เพื่อความไวและราคาถูก
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5)

def check_and_release_users(session: Session):
    busy_users = session.exec(
        select(User).where(User.is_available == False, User.active_project_end_date != None)
    ).all()
    now = datetime.now()
    released_count = 0
    for user in busy_users:
        if user.active_project_end_date and now > user.active_project_end_date:
            user.is_available = True
            user.active_project_end_date = None
            session.add(user)
            released_count += 1

    if released_count > 0:
        session.commit()
        print(f"Auto-released {released_count} heroes from duty.")
