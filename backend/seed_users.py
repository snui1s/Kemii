"""
Seed Script - Generate 130 fake users (10 per department)
Run: uv run python seed_users.py
"""
import random
import json
from sqlmodel import Session
from database import engine, create_db_and_tables
from models import User
from skills_data import DEPARTMENTS

# Thai first names for variety
FIRST_NAMES = [
    "สมชาย", "สมหญิง", "วิชัย", "วิภา", "ประยุทธ์", "ประภา",
    "อนุชา", "อนุรักษ์", "กิตติ", "กิตติยา", "ธนา", "ธนิดา",
    "พิชัย", "พิมพ์", "ศักดิ์", "ศิริ", "สุชาติ", "สุนีย์",
    "อารี", "อารยา", "นพดล", "นพวรรณ", "วัชระ", "วาสนา",
    "ชัยวัฒน์", "ชุติมา", "ภานุ", "ภาวิณี", "ธีระ", "ธีรา",
    "ปรีชา", "ปริญญา", "มานะ", "มาลี", "สราวุธ", "สายฝน",
    "อภิชาติ", "อภิญญา", "วรพล", "วรรณา", "เกียรติ", "เกศริน",
    "ณัฐ", "ณิชา", "ปิยะ", "ปิยนุช", "สุรชัย", "สุรีย์",
    "ดำรง", "ดาวเรือง", "บุญมี", "บุญยง", "รัตน์", "รัชนี"
]

# Character classes based on highest OCEAN score
def get_class(o, c, e, a, n):
    scores = {"Mage": o, "Paladin": c, "Warrior": e, "Cleric": a, "Rogue": n}
    return max(scores, key=scores.get)

def seed_users():
    create_db_and_tables()
    
    with Session(engine) as session:
        user_count = 0
        
        for dept in DEPARTMENTS:
            dept_name = dept["name"]
            dept_skills = dept["skills"]
            
            for i in range(10):
                # Random OCEAN scores (10-50 range)
                o = random.randint(15, 45)
                c = random.randint(15, 45)
                e = random.randint(15, 45)
                a = random.randint(15, 45)
                n = random.randint(10, 40)
                
                # Random 3-5 skills from this department
                num_skills = random.randint(3, 5)
                selected_skills = random.sample(dept_skills, num_skills)
                skills_json = [
                    {"name": skill, "level": random.randint(2, 5)}
                    for skill in selected_skills
                ]
                
                # Create user
                name = random.choice(FIRST_NAMES)
                user = User(
                    name=f"{name} ({dept['id'][:4].upper()}-{i+1})",
                    character_class=get_class(o, c, e, a, n),
                    level=1,
                    ocean_openness=o,
                    ocean_conscientiousness=c,
                    ocean_extraversion=e,
                    ocean_agreeableness=a,
                    ocean_neuroticism=n,
                    skills=json.dumps(skills_json, ensure_ascii=False),
                    is_available=True
                )
                session.add(user)
                user_count += 1
            
            print(f"✅ Created 10 users for {dept_name}")
        
        session.commit()
        print(f"\n🎉 Total: {user_count} users created!")

if __name__ == "__main__":
    seed_users()
