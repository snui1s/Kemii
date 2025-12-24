"""
Script to seed initial master data (Questions, etc.)
Run: uv run backend/scripts/seed_data.py
"""
import sys
import os

# Add parent directory to path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
import random
import json

# URL ของ API (ต้องรัน main.py รอไว้ก่อนนะ)
API_URL = "http://localhost:8000/submit-assessment"

# --- PART 1: ฟังก์ชันช่วยสร้างคำตอบ (สำหรับคนใหม่ๆ) ---
def generate_answers(weight):
    """
    สร้าง Array คำตอบ 12 ข้อ โดยสุ่มตามน้ำหนักที่กำหนด
    เช่น weight={'D': 6, 'C': 4} -> จะมี D 6 ข้อ, C 4 ข้อ, ที่เหลือสุ่ม
    """
    choices = []
    # 1. ใส่ตามโควต้าที่กำหนด
    for type_char, count in weight.items():
        choices.extend([type_char] * count)
    
    # 2. ถ้ายังไม่ครบ 12 ข้อ ให้สุ่มเติมจนครบ
    while len(choices) < 12:
        choices.append(random.choice(['D', 'I', 'S', 'C']))
        
    random.shuffle(choices) # สลับตำแหน่งให้เนียน
    
    # แปลงเป็น Format ที่ API ต้องการ
    return [{"question_id": i+1, "value": val} for i, val in enumerate(choices[:12])]

# --- PART 2: เตรียมข้อมูล (Roster) ---

# 2.1 ทีมพันธุ์แท้ (Original ของคุณ - Hardcoded)
original_team = [
    {
        "name": "สมชาย (D-Pure)",
        "answers": [{"question_id": i, "value": v} for i, v in enumerate(["D", "D", "D", "I", "D", "C", "D", "D", "D", "S", "D", "D"], 1)]
    },
    {
        "name": "น้องจอย (I-Pure)",
        "answers": [{"question_id": i, "value": v} for i, v in enumerate(["I", "I", "S", "I", "I", "I", "D", "I", "S", "I", "I", "S"], 1)]
    },
    {
        "name": "พี่กบ (S-Pure)",
        "answers": [{"question_id": i, "value": v} for i, v in enumerate(["S", "S", "C", "S", "S", "S", "I", "S", "C", "S", "D", "S"], 1)]
    },
    {
        "name": "Dev เทพ (C-Pure)",
        "answers": [{"question_id": i, "value": v} for i, v in enumerate(["C", "C", "D", "C", "C", "C", "S", "C", "C", "D", "C", "C"], 1)]
    }
]

# 2.2 ทีมพันธุ์ผสม (The Hybrids - Generated)
hybrid_team = [
    {
        "name": "คุณเป๊ะ (PM สายโหด)", 
        "answers": generate_answers({'D': 5, 'C': 5, 'I': 1, 'S': 1}) # D+C
    },
    {
        "name": "ท็อป (Sales ไฟแลบ)", 
        "answers": generate_answers({'D': 5, 'I': 5, 'S': 1, 'C': 1}) # D+I
    },
    {
        "name": "น้องอาร์ต (UX ใจดี)", 
        "answers": generate_answers({'I': 5, 'S': 5, 'D': 1, 'C': 1}) # I+S
    },
    {
        "name": "พี่เนิร์ด (Senior Dev)", 
        "answers": generate_answers({'C': 6, 'S': 4, 'I': 1, 'D': 1}) # C+S
    },
    {
        "name": "น้องใหม่ (เป็ด General)", 
        "answers": generate_answers({'D': 3, 'I': 3, 'S': 3, 'C': 3}) # Balance
    }
]

# รวมทีมทั้งหมด
all_users = original_team + hybrid_team

# --- PART 3: ยิงข้อมูลเข้าระบบ ---
print(f"🚀 กำลังนำเข้าสมาชิกทีมทั้งหมด {len(all_users)} คน...\n")

success_count = 0

for user in all_users:
    try:
        response = requests.post(API_URL, json=user)
        
        if response.status_code == 200:
            res_data = response.json()
            # ดึงสัตว์ที่ระบบคำนวณได้มาโชว์
            character_class = res_data.get('character_class', 'Unknown')
            type_code = res_data.get('dominant_type', '?')
            print(f"✅ {user['name']:<20} -> บันทึกสำเร็จ! เป็น '{character_class}' ({type_code})")
            success_count += 1
        else:
            print(f"❌ {user['name']:<20} -> ล้มเหลว: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"⚠️  ติดต่อ Server ไม่ได้! (ลืมรัน main.py หรือเปล่า?)")
        break
    except Exception as e:
        print(f"⚠️  Error ยิงข้อมูล {user['name']}: {e}")

print(f"\nสรุปผล: สำเร็จ {success_count} / {len(all_users)} คน")
print("------------------------------------------------")
print("ลองยิง API: GET http://localhost:8000/analyze-team เพื่อดูผลวิเคราะห์ทีมได้เลย!")