import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.matching import calculate_team_cost, cost_to_score
from models import User

def make_user(name, o, c, e, a, n):
    return User(
        name=name,
        ocean_openness=o,
        ocean_conscientiousness=c,
        ocean_extraversion=e,
        ocean_agreeableness=a,
        ocean_neuroticism=n
    )

def test_pair(name, u1, u2):
    cost = calculate_team_cost([u1, u2])
    score = cost_to_score(cost)
    print(f"--- {name} ---")
    print(f"{u1.name}: O={u1.ocean_openness}, C={u1.ocean_conscientiousness}, E={u1.ocean_extraversion}, A={u1.ocean_agreeableness}, N={u1.ocean_neuroticism}")
    print(f"{u2.name}: O={u2.ocean_openness}, C={u2.ocean_conscientiousness}, E={u2.ocean_extraversion}, A={u2.ocean_agreeableness}, N={u2.ocean_neuroticism}")
    print(f"Cost: {cost:.4f} => Score: {score}%")
    print("")

# Case 1: The Perfect Couple (Identical, High A/C, Low N)
# Var=0, MeanN=Low.
u1 = make_user("Angel 1", 30, 50, 30, 50, 10)
u2 = make_user("Angel 2", 30, 50, 30, 50, 10)
test_pair("Perfect Match (Identical Good)", u1, u2)

# Case 2: The Toxic Pair (Both Low A, High N)
# Var=0 (similar), but Mean A is Low (Penalty!), Mean N is High (Cost)
u3 = make_user("Toxic 1", 30, 20, 30, 10, 50)
u4 = make_user("Toxic 2", 30, 20, 30, 10, 50)
test_pair("Toxic Duo (Both Bad Traits)", u3, u4)

# Case 3: The Opposite (Max Variance)
# One is Min traits, One is Max traits (except N inverted?)
# Let's maximize Variance. 10 vs 50.
u5 = make_user("Min Stats", 10, 10, 10, 10, 10)
u6 = make_user("Max Stats", 50, 50, 50, 50, 50)
test_pair("Opposite Stats (Max Variance)", u5, u6)

# Case 4: The Worst Nightmare
# Max Variance in C, A, E, O.
# Max N for both.
# Low Mean A (One 10, One 10?) -> High Penalty.
# To get Max Var AND Low Mean A: 10 and 10? Var is 0.
# To get Max Cost, we want HIGH Variance OR High Penalty?
# Formula: 1.5*Var(A) + Penalty(Mean A).
# Var(10,50) = 400 -> VarStar=1. Mean=30. Penalty(30->0.5) = 0. (Since 30 maps to 0.5 normalized, Tau=0.625. 0.625-0.5 = 0.125 penalty).
# Var(10,10) = 0. Mean=10. Penalty(10->0.0) = 0.625 penalty.
# 1.5*1 + 2*0.125 = 1.75
# 1.5*0 + 2*0.625 = 1.25
# So High Variance is usually worse for A?
# Let's check calculation.
u7 = make_user("Low A 1", 10, 10, 10, 10, 50)
u8 = make_user("Low A 2", 10, 10, 10, 50, 50) # 10 and 50 A
test_pair("Mixed A (10 vs 50)", u7, u8)

u9 = make_user("Both Low A", 10, 10, 10, 10, 50)
u10 = make_user("Both Low A", 10, 10, 10, 10, 50)
test_pair("Both Low A (10)", u9, u10)
