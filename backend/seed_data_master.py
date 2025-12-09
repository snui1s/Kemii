import requests
import random
import json
import time

# ⚠️⚠️ แก้บรรทัดนี้: ใส่ URL ของ Render ที่คุณได้มา ⚠️⚠️
# ตัวอย่าง: API_URL = "https://4elements-api.onrender.com/submit-assessment"
API_URL = "http://localhost:8000/submit-assessment" 

# --- PART 1: ฟังก์ชันช่วยสร้างคำตอบ (Randomizer Logic) ---
def generate_answers(weight):
    """
    สร้าง Array คำตอบ 15 ข้อ โดยสุ่มตาม  น้ำหนักที่กำหนด
    เช่น weight={'D': 10, 'C': 5} -> จะมี D 10 ข้อ, C 5 ข้อ (Most)
    ส่วน Least จะสุ่มตัวที่ไม่ใช่ Most เพื่อให้คะแนนไม่หักล้างกันจนหมด
    """
    choices = []
    # 1. ใส่ Most ตามโควต้า
    for type_char, count in weight.items():
        choices.extend([type_char] * count)
    
    # เติมให้ครบ 15 ข้อ (ถ้าขาด)
    while len(choices) < 15:
        choices.append(random.choice(['D', 'I', 'S', 'C']))
        
    random.shuffle(choices) # สลับตำแหน่งข้อ

    answers = []
    for i, most_val in enumerate(choices[:15]):
        # สุ่ม Least (ต้องไม่ซ้ำกับ Most)
        options = ['D', 'I', 'S', 'C']
        options.remove(most_val)
        least_val = random.choice(options)

        answers.append({
            "question_id": i + 1,
            "most_value": most_val,
            "least_value": least_val
        })
    
    return answers

# --- PART 2: เตรียมข้อมูล (Roster) ---

# 2.1 ทีมพันธุ์แท้ (Original 4) - คะแนนจะโดดเด่นไปทางเดียว
original_team = [
    {
        "name": "สมชาย",
        "answers": generate_answers({'D': 12, 'I': 1, 'S': 1, 'C': 1})
    },
    {
        "name": "น้องจอย",
        "answers": generate_answers({'I': 12, 'D': 1, 'S': 1, 'C': 1})
    },
    {
        "name": "พี่กบ",
        "answers": generate_answers({'S': 12, 'I': 1, 'D': 1, 'C': 1})
    },
    {
        "name": "Dev เทพ",
        "answers": generate_answers({'C': 12, 'S': 1, 'I': 1, 'D': 1})
    }
]

# 2.2 ทีมพันธุ์ผสม (The Hybrids) - คะแนนจะก้ำกึ่งกัน
hybrid_team = [
    {
        "name": "คุณเป๊ะ", 
        "answers": generate_answers({'D': 7, 'C': 8}) # D+C (สั่ง+ละเอียด)
    },
    {
        "name": "ท็อป", 
        "answers": generate_answers({'D': 7, 'I': 8}) # D+I (ลุย+คุย)
    },
    {
        "name": "น้องอาร์ต", 
        "answers": generate_answers({'I': 7, 'S': 8}) # I+S (ศิลปิน+เพื่อน)
    },
    {
        "name": "พี่เนิร์ด", 
        "answers": generate_answers({'C': 8, 'S': 7}) # C+S (ระบบ+นิ่ง)
    },
    {
        "name": "น้องใหม่", 
        "answers": generate_answers({'D': 4, 'I': 4, 'S': 4, 'C': 3}) # สมดุล
    }
]

all_users = original_team + hybrid_team

# --- PART 3: ยิงข้อมูลเข้า Server ---
print(f"🚀 กำลังส่งข้อมูลไปยัง: {API_URL}")
print(f"📦 จำนวนสมาชิกที่จะเพิ่ม: {len(all_users)} คน\n")

success_count = 0

for i, user in enumerate(all_users):
    try:
        print(f"[{i+1}/{len(all_users)}] กำลังเพิ่ม {user['name']}...", end=" ")
        
        response = requests.post(API_URL, json=user)
        
        if response.status_code == 200:
            res_data = response.json()
            animal = res_data.get('animal', '?')
            print(f"✅ สำเร็จ! (ได้เป็น: {animal})")
            success_count += 1
        else:
            print(f"❌ ล้มเหลว: {response.text}")
            
    except Exception as e:
        print(f"⚠️ Error: {e}")
    
    # หน่วงเวลานิดนึง (กัน Server ตกใจ)
    time.sleep(0.5)

print("\n------------------------------------------------")
print(f"🎉 เสร็จสิ้น! นำเข้าสำเร็จ {success_count} คน")
print("👉 ไปเช็คที่หน้าเว็บ Vercel ของคุณได้เลย!")