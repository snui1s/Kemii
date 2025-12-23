import random
import statistics
import copy
import math

# --- 1. Class และ สูตรคำนวณ (Core Logic: Kemii Golden Formula) ---

class Person:
    def __init__(self, name, o, c, e, a, n):
        self.name = name
        self.o = o
        self.c = c
        self.e = e
        self.a = a
        self.n = n

    def __repr__(self):
        return f"{self.name}"

    def get_leadership_score(self):
        """
        คำนวณศักยภาพความเป็นผู้นำ (Heuristic)
        เน้น: วินัยสูง (C), ใจดี (A), ไม่เครียด (N), กล้าแสดงออกพอประมาณ (E)
        """
        return self.c + self.a + (0.5 * self.e) - self.n

def calculate_kemii_score(team):
    """
    Kemii's Golden Formula
    เป้าหมาย: คะแนนยิ่งน้อย ยิ่งดี (0.0 คือ Perfect)
    """
    if not team or len(team) < 2:
        return 0.0

    # ดึงค่าพลัง
    c_vals = [p.c for p in team]
    a_vals = [p.a for p in team]
    e_vals = [p.e for p in team]
    o_vals = [p.o for p in team]
    n_vals = [p.n for p in team]

    # Helper: Normalized Variance (0-1)
    def get_norm_var(values):
        try:
            var = statistics.pvariance(values)
        except:
            var = 0
        return var / 400.0

    # Helper: Normalized Mean (0-1)
    def get_norm_mean(values):
        avg = statistics.mean(values)
        return (avg - 10) / 40.0

    # คำนวณองค์ประกอบ
    # 1. Core Compatibility (สำคัญสุด Weight 1.5)
    term_c = 1.5 * get_norm_var(c_vals)
    term_a_var = 1.5 * get_norm_var(a_vals)

    # 2. Style Compatibility (Weight 1.0)
    term_e = 1.0 * get_norm_var(e_vals)
    term_o = 1.0 * get_norm_var(o_vals)

    # 3. Stress Level (Weight 1.0) - ยิ่งเฉลี่ยเยอะ ยิ่งไม่ดี
    term_n = 1.0 * get_norm_mean(n_vals)

    # 4. Toxic Penalty (Weight 2.0) - ถ้าค่าเฉลี่ย A ต่ำกว่าเกณฑ์ โดนทำโทษ
    avg_a_norm = get_norm_mean(a_vals)
    tau = 0.75  # เกณฑ์ความใจดี (เทียบเท่าคะแนนดิบ 40)
    term_penalty = 2.0 * max(0, tau - avg_a_norm)

    total_score = term_c + term_a_var + term_e + term_o + term_n + term_penalty
    return total_score

def get_grade(score):
    if score <= 0.75: return "💎 S (Dream Team)"  
    if score <= 1.25: return "🟢 A (Good)"
    if score <= 2.00: return "🟡 B (Average)"
    if score <= 3.00: return "🟠 C (Risky)"
    return "🔴 D (Toxic)"

# --- 2. Team Sizing Logic (คำนวณขนาดทีมที่เหมาะสม) ---

def calculate_optimal_teams(total_people):
    """
    คำนวณจำนวนทีม เพื่อให้ได้สมาชิก 5-7 คนต่อทีม (ดีที่สุด)
    หรืออย่างน้อย 4-9 คน (ยอมรับได้)
    """
    # ลองหารดูว่าจำนวนทีมเท่าไหร่ที่ทำให้สมาชิกเฉลี่ยตกอยู่ที่ 5-7 คน
    best_num_teams = 1
    min_dist_to_ideal = float('inf')

    # ลองไล่จำนวนทีมที่เป็นไปได้ (อย่างน้อยต้องมีทีมละ 3 คนขึ้นไปถึงจะเรียกว่าทีม)
    max_possible_teams = total_people // 3 
    
    print(f"\n📐 Analyzing optimal team size for {total_people} people...")
    
    for k in range(1, max_possible_teams + 1):
        avg_size = total_people / k
        
        # เช็คว่าเป็นช่วงที่ยอมรับได้ไหม (4-9)
        if 4 <= avg_size <= 9:
            # ยิ่งใกล้ 6 (ค่ากลางของ 5-7) ยิ่งดี
            dist = abs(avg_size - 6)
            if dist < min_dist_to_ideal:
                min_dist_to_ideal = dist
                best_num_teams = k
    
    avg_per_team = total_people / best_num_teams
    print(f"   => แนะนำแบ่ง: {best_num_teams} ทีม (เฉลี่ย {avg_per_team:.1f} คน/ทีม)")
    return best_num_teams

# --- 3. Draft Function (จัดทีม + เลือกหัวหน้า) ---

# --- 3. Draft Function (ฉบับปรับปรุง: Sorting Hat Logic) ---

def draft_teams(all_people, num_teams):
    print(f"\n🚀 เริ่มต้นจัดคน {len(all_people)} คน ลง {num_teams} ทีม (Balanced Mode)...")
    
    # 1. คัดเลือกหัวหน้าทีม (Leader Selection) - เหมือนเดิม
    # ใช้ L-Score: C + A + 0.5E - N
    leaders = sorted(all_people, key=lambda x: x.get_leadership_score(), reverse=True)[:num_teams]
    
    teams = [[l] for l in leaders] # เริ่มต้นทีมด้วยหัวหน้า
    print("--- Step 1: วางตัวหัวหน้าทีม (Leaders) ---")
    for i, l in enumerate(leaders):
        print(f"   👑 ทีม {i+1}: {l.name} (L-Score: {l.get_leadership_score():.1f})")

    # 2. เตรียม Pool คนที่เหลือ (The Pool)
    remaining_people = [p for p in all_people if p not in leaders]

    # 3. จัดลำดับคนที่จะถูกเลือก (Difficulty Sorting) ⭐️ จุดสำคัญ!
    # เราจะเรียงคนตาม "ความยากในการหาทีม" (Difficulty)
    # คนที่ N สูง (เครียด), A ต่ำ (ดุ), C ต่ำ (ขี้เกียจ) ถือเป็น "โจทย์ยาก" ต้องรีบหาที่ลงก่อน
    # สูตรความยาก: N - A - C (ยิ่งมาก ยิ่งหาที่ลงยาก)
    
    remaining_people.sort(key=lambda x: x.n - x.a - x.c, reverse=True)
    
    print(f"\n--- Step 2: กระจายลูกทีม ({len(remaining_people)} คน) ---")
    print("   (เรียงจากคนที่หาทีมลงยากสุด -> ง่ายสุด เพื่อการกระจายตัวที่ดี)")

    # 4. เริ่มวางคนลงหลุม (Smart Placement)
    for p in remaining_people:
        best_team_index = -1
        min_score_increase = float('inf')
        
        # กฎการเกลี่ยทีม: ห้ามเติมทีมที่มีคนเยอะเกินหน้าเพื่อน
        # หาจำนวนสมาชิกน้อยที่สุดในขณะนั้น
        current_sizes = [len(t) for t in teams]
        min_size = min(current_sizes)
            
        # ลองเอาคนนี้ไปใส่ในทุกทีม
        for i in range(num_teams):
            # Constraint: ถ้าทีมนี้คนเยอะกว่าชาวบ้าน (เช่น เพื่อนมี 4 ทีมนี้มี 5) ข้ามไปก่อน!
            # เพื่อบังคับให้เติมทีมที่คนน้อยกว่า (Round Robin effect)
            if len(teams[i]) > min_size:
                continue

            # ลองคำนวณคะแนนถ้าใส่คนนี้เข้าไป
            current_team_score = calculate_kemii_score(teams[i])
            temp_team = teams[i] + [p]
            new_team_score = calculate_kemii_score(temp_team)
            
            # ดูว่าทีมไหนคะแนน "เพิ่มขึ้นน้อยที่สุด" (Cost ต่ำสุด)
            score_increase = new_team_score - current_team_score
            
            if score_increase < min_score_increase:
                min_score_increase = score_increase
                best_team_index = i
        
        # ยืนยันเอาคนนี้ใส่ทีมที่ดีที่สุด
        teams[best_team_index].append(p)
        # print(f"   -> {p.name} ลงทีม {best_team_index+1} (Size: {len(teams[best_team_index])})")

    return teams
# --- 4. Optimize Function (แก้ทีมพัง) ---

def optimize_teams(teams):
    print("\n" + "=" * 60)
    print("🕵️‍♂️ START WHITEBOX OPTIMIZATION (เจาะลึกการสลับตัว)")
    print("=" * 60)

    max_rounds = 30 # ลดจำนวนรอบลงหน่อยเพราะสูตรซับซ้อนขึ้น

    for round_num in range(1, max_rounds + 1):
        print(f"\n--- 🔄 Round {round_num} ---")
        swapped = False

        # หาแย่สุด
        team_scores = []
        for i, t in enumerate(teams):
            s = calculate_kemii_score(t)
            team_scores.append((i, s))

        team_scores.sort(key=lambda x: x[1], reverse=True) # มาก = แย่
        worst_team_idx = team_scores[0][0]
        worst_score = team_scores[0][1]
        worst_team = teams[worst_team_idx]

        print(f"🎯 เป้าหมาย: แก้ไข Team {worst_team_idx+1} (Score: {worst_score:.4f})")

        if worst_score <= 1.0: # ถ้าเกรด A แล้ว พอเถอะ
            print("   ✨ ทีมแย่สุดอยู่ในเกณฑ์ดี (Grade A) แล้ว จบการทำงาน")
            break

        for other_idx in range(len(teams)):
            if other_idx == worst_team_idx:
                continue
            other_team = teams[other_idx]
            
            # ห้ามสลับหัวหน้าทีม (คนแรกของลิสต์) เพื่อรักษาโครงสร้าง Leader
            # เริ่ม loop คนที่ 1 เป็นต้นไป (คนที่ 0 คือ Leader)
            
            for p1_idx in range(1, len(worst_team)): 
                p1 = worst_team[p1_idx]
                
                for p2_idx in range(1, len(other_team)):
                    p2 = other_team[p2_idx]

                    score_before = calculate_kemii_score(worst_team) + calculate_kemii_score(other_team)

                    # จำลองการสลับ
                    sim_worst = [m for m in worst_team if m != p1] + [p2]
                    sim_other = [m for m in other_team if m != p2] + [p1]

                    score_after = calculate_kemii_score(sim_worst) + calculate_kemii_score(sim_other)
                    diff = score_before - score_after

                    if score_after < score_before: # ยิ่งน้อยยิ่งดี
                        print(f"      ✅ FOUND SWAP!")
                        print(f"         📍 สลับ: [{p1.name}] (T{worst_team_idx+1}) <-> [{p2.name}] (T{other_idx+1})")
                        print(f"         💰 Global Cost Reduced: {diff:.4f}")

                        # Execute Swap
                        worst_team[p1_idx] = p2
                        other_team[p2_idx] = p1

                        swapped = True
                        break
                if swapped: break
            if swapped: break

        if not swapped:
            print("   ❌ รอบนี้หาทางสลับลูกทีมไม่ได้เลย (Leaders ไม่ถูกสลับ)")
            break

    print("\n" + "=" * 60)
    print("🏁 FINISHED OPTIMIZATION")
    print("=" * 60)
    return teams

# --- 5. Manual Mode & Utilities ---

def find_person_and_team(name, teams):
    for i, team in enumerate(teams):
        for p in team:
            if p.name == name:
                return p, team, i
    return None, None, None

def manual_swap_mode(teams):
    print("\n" + "=" * 60)
    print("🎮 ENTERING MANUAL SANDBOX MODE")
    print("พิมพ์ชื่อ 2 คนเพื่อสลับ (เช่น 'User_A User_B') | พิมพ์ 'exit' เพื่อจบ")
    print("=" * 60)

    while True:
        print("\n📊 Current Team Status (Kemii Formula):")
        total_score = 0

        for i, team in enumerate(teams):
            score = calculate_kemii_score(team)
            total_score += score
            grade = get_grade(score)

            print(f"Team {i+1} | Score: {score:.4f} {grade}")
            print("-" * 45)
            # Leader mark
            for idx, p in enumerate(team):
                role = "👑" if idx == 0 else "  "
                print(f" {role} {p.name:<8} [C:{p.c:<2} A:{p.a:<2} N:{p.n:<2} E:{p.e:<2}] O:{p.o:<2}]")
            print()

        print(f"   >> GRAND TOTAL COST: {total_score:.4f}")
        print("=" * 45)

        command = input("👉 Command: ").strip()
        if command.lower() in ["exit", "quit", "stop"]:
            break

        try:
            parts = command.split()
            if len(parts) != 2:
                print("❌ Format ผิด! ต้องพิมพ์ 2 ชื่อ")
                continue

            name1, name2 = parts[0], parts[1]
            p1, team1, idx1 = find_person_and_team(name1, teams)
            p2, team2, idx2 = find_person_and_team(name2, teams)

            if not p1 or not p2:
                print("❌ หาชื่อไม่เจอ (Case Sensitive)")
                continue
            if idx1 == idx2:
                print("⚠️ อยู่ทีมเดียวกันอยู่แล้ว")
                continue

            # Calculate Before
            s_before_1 = calculate_kemii_score(team1)
            s_before_2 = calculate_kemii_score(team2)

            # Swap
            # ต้องหา index เพื่อสลับให้ถูกตำแหน่ง (เผื่อสลับ Leader)
            ix1 = team1.index(p1)
            ix2 = team2.index(p2)
            team1[ix1], team2[ix2] = team2[ix2], team1[ix1]
            
            # Calculate After
            s_after_1 = calculate_kemii_score(team1)
            s_after_2 = calculate_kemii_score(team2)
            
            diff = (s_before_1 + s_before_2) - (s_after_1 + s_after_2)

            print(f"\n🔄 SWAP RESULT:")
            print(f"   Team {idx1+1}: {s_before_1:.3f} -> {s_after_1:.3f}")
            print(f"   Team {idx2+1}: {s_before_2:.3f} -> {s_after_2:.3f}")
            if diff > 0:
                print(f"   ✅ ดีขึ้น! Cost ลดลง {diff:.4f}")
            else:
                print(f"   ⚠️ แย่ลง! Cost เพิ่มขึ้น {abs(diff):.4f}")

        except Exception as e:
            print(f"❌ Error: {e}")

# --- 6. Main Execution ---

# สร้างประชากรทดสอบ (เพิ่มจำนวนคนเพื่อให้เห็นผลเรื่อง Team Size)
names = [chr(i) for i in range(65, 91)] # A-Z (26 คน)
all_people = []
print(f"🎲 Generating population of {len(names)} people...")

for n in names:
    # สุ่มแบบมี bias นิดหน่อยให้เหมือนคนจริง (ไม่ใช่ Random มั่วซั่ว)
    p = Person(
        name=f"{n}",
        o=random.randint(25, 50),
        c=random.randint(20, 50), # มีทั้งคนขยันและขี้เกียจ
        e=random.randint(15, 50),
        a=random.randint(25, 50),
        n=random.randint(10, 45)  # มีทั้งคนนิ่งและคนเครียด
    )
    all_people.append(p)

# 1. คำนวณจำนวนทีมที่เหมาะสม
num_teams = calculate_optimal_teams(len(all_people))

input("\n👉 Press Enter to start DRAFTING...")

# 2. จัดทีม
teams = draft_teams(all_people, num_teams)

# 3. Optimize
input("\n👉 Press Enter to start OPTIMIZATION...")
teams = optimize_teams(teams)

# 4. Manual
input("\n👉 Press Enter to enter MANUAL MODE...")
manual_swap_mode(teams)