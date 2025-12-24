"""
Seed Script - Generate 65 users (5 per department)
Each department has 5 people with different OCEAN profiles (5 character classes)
Run: uv run python seed_users.py
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import random
import json
from sqlmodel import Session
from database import engine, create_db_and_tables
from models import User
from skills_data import DEPARTMENTS
from auth import get_password_hash

# Thai first names
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

# OCEAN profiles for each character class
# Format: (O, C, E, A, N, class_name)
CLASS_PROFILES = [
    {"class": "Mage",    "o": (40, 50), "c": (20, 35), "e": (15, 30), "a": (25, 40), "n": (15, 30)},  # High O
    {"class": "Paladin", "o": (25, 35), "c": (40, 50), "e": (25, 40), "a": (35, 45), "n": (10, 25)},  # High C
    {"class": "Warrior", "o": (20, 35), "c": (30, 40), "e": (40, 50), "a": (20, 35), "n": (20, 35)},  # High E
    {"class": "Cleric",  "o": (25, 40), "c": (30, 40), "e": (20, 35), "a": (40, 50), "n": (10, 25)},  # High A
    {"class": "Rogue",   "o": (30, 40), "c": (15, 30), "e": (30, 40), "a": (15, 30), "n": (35, 50)},  # High N
]

def get_random_in_range(range_tuple):
    return random.randint(range_tuple[0], range_tuple[1])

def seed_users():
    create_db_and_tables()
    
    with Session(engine) as session:
        user_count = 0
        used_names = set()
        
        for dept in DEPARTMENTS:
            dept_id = dept["id"]
            dept_name = dept["name"]
            dept_skills = dept["skills"]
            
            # Create 5 users with different character classes
            for i, profile in enumerate(CLASS_PROFILES):
                # Generate OCEAN based on class profile
                o = get_random_in_range(profile["o"])
                c = get_random_in_range(profile["c"])
                e = get_random_in_range(profile["e"])
                a = get_random_in_range(profile["a"])
                n = get_random_in_range(profile["n"])
                
                character_class = profile["class"]
                
                # Generate skills (Now using Department Name directly)
                # Format: [{"name": "Department Name", "level": 1}]
                skills_json = [{"name": dept_name, "level": 1}]
                
                # Generate name with dept suffix to ensure uniqueness
                name = random.choice(FIRST_NAMES)
                dept_code = dept_id[:3].upper()
                full_name = f"{name} ({dept_code}-{i+1})"
                
                # Default password for all seed users: "1234"
                # We calculate it once efficiently if we could, but here we can just call it (or move it out of loop)
                # But to avoid moving out of loop for simple replace, I'll just call it or cleaner: define it before loop.
                # However, replace_file_content targets this block.
                # Let's rely on the import.
                
                user = User(
                    name=full_name,
                    email=f"user{user_count+1}@kemii.com",
                    hashed_password=get_password_hash("1234"),
                    character_class=character_class,
                    level=random.randint(1, 5),
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
            
            print(f"✅ Created 5 users for {dept_name}")
        
        session.commit()
        print(f"\n🎉 Total: {user_count} users created! (5 × {len(DEPARTMENTS)} departments)")
        print("📊 Each department has: Mage, Paladin, Warrior, Cleric, Rogue")

if __name__ == "__main__":
    seed_users()
