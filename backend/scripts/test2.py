import random
import statistics
import sys
import os

# Add parent directory to path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import copy

# --- Core Logic: Academic Formula ---

class Person:
    def __init__(self, name, o, c, e, a, n):
        self.name = name; self.o = o; self.c = c; self.e = e; self.a = a; self.n = n
    def __repr__(self): return f"{self.name}"

def normalize_score(x):
    """แปลงคะแนน 10-50 ให้เป็น 0-1"""
    # สูตร: (X - Min) / Range
    return (x - 10) / 40

def normalize_variance(data):
    """แปลง Variance ให้เป็น 0-1"""
    # ใช้ Population Variance (pvariance)
    var_raw = statistics.pvariance(data)
    # Var_max ของช่วงกว้าง 40 คือ 400
    return var_raw / 400

def calculate_academic_cost(team, lam=2.0, tau=0.75):
    """
    สูตร Academic: Cost = 1.5*Var*(C) + ... + lambda * max(0, tau - A_bar*)
    """
    if not team: return 0
    
    # 1. เตรียมข้อมูล
    c_vals = [p.c for p in team]
    a_vals = [p.a for p in team]
    e_vals = [p.e for p in team]
    o_vals = [p.o for p in team]
    n_vals = [p.n for p in team]

    # 2. คำนวณ Normalized Variance (0-1)
    # ยิ่งมาก = ยิ่งต่าง (ไม่ดี)
    var_c = normalize_variance(c_vals)
    var_a = normalize_variance(a_vals)
    var_e = normalize_variance(e_vals)
    var_o = normalize_variance(o_vals)

    # 3. คำนวณ Normalized Mean (0-1)
    mean_n = normalize_score(statistics.mean(n_vals))
    mean_a = normalize_score(statistics.mean(a_vals))

    # 4. คำนวณ Cost แต่ละพจน์
    # Priority 1: C & A (ต้องเหมือนกัน) -> Weight 1.5
    cost_c = 1.5 * var_c
    cost_a_gap = 1.5 * var_a
    
    # Priority 2: E & O (สไตล์) -> Weight 1.0
    cost_e = 1.0 * var_e
    cost_o = 1.0 * var_o
    
    # Priority 3: Stress -> Weight 1.0
    cost_n = 1.0 * mean_n

    # Priority 4: Toxic Penalty (ใช้ Tau แบบ Normalized = 0.75)
    # ถ้า mean_a < 0.75 จะเริ่มโดนปรับ
    penalty = lam * max(0, tau - mean_a)

    total_cost = cost_c + cost_a_gap + cost_e + cost_o + cost_n + penalty
    
    return total_cost

# --- Utility Functions ---

def print_team_stats(team):
    cost = calculate_academic_cost(team)
    # แปลง Cost เป็น Grade (สเกลจะเปลี่ยนไปจาก 0-400 เดิม เป็น 0-5 โดยประมาณ)
    # 0.0 - 0.5 : เทพ
    # 0.5 - 1.0 : โอเค
    # 1.0+      : แย่
    grade = "🟢 A+" if cost < 0.3 else "🟢 A" if cost < 0.5 else "🟡 B" if cost < 0.8 else "🔴 C"
    
    print(f"Team Score (Cost): {cost:.4f} | Grade: {grade}")
    for p in team:
        print(f" - {p.name:<8} [C:{p.c} A:{p.a} N:{p.n}]")

# --- Testing ---

# สร้างทีมทดสอบ
p1 = Person("Boss",  50, 50, 50, 50, 10) # เทพ
p2 = Person(" รอง",  45, 48, 45, 48, 15) # เทพรอง
p3 = Person("กลาง",  30, 30, 30, 30, 30) # กลางๆ
p4 = Person("แย่",   10, 10, 10, 10, 50) # ตัวถ่วง

print("--- 1. Dream Team (คะแนนเกือบเท่ากัน สูงหมด) ---")
team_good = [p1, p2] 
print_team_stats(team_good)
# Variance ต่ำมาก, Mean A สูง (1.0) -> Penalty 0

print("\n--- 2. Conflict Team (ต่างกันสุดขั้ว) ---")
team_bad = [p1, p4]
print_team_stats(team_bad)
# Variance สูงสุด (400/400 = 1.0), Mean A กลางๆ (0.5) -> โดน Penalty

print("\n--- 3. Toxic Team (นิสัยเสียเหมือนกัน) ---")
team_toxic = [p4, p4]
print_team_stats(team_toxic)
# Variance 0 (เหมือนกันเป๊ะ), แต่ Mean A ต่ำ (0.0) -> โดน Penalty หนักมาก!