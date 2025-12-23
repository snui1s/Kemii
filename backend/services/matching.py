from typing import List, Optional, Dict
from sqlmodel import Session, select
import math

# Constants
TAU = 0.625
LAMBDA = 2.0

def get_stats(u):
    return {
        "O": u.ocean_openness or 0,
        "C": u.ocean_conscientiousness or 0,
        "E": u.ocean_extraversion or 0,
        "A": u.ocean_agreeableness or 0,
        "N": u.ocean_neuroticism or 0
    }

def calculate_academic_cost(team_stats_list):
    """
    Calculate team cost using the academic formula:
    Cost = 1.5×Var*(C) + 1.5×Var*(A) + 1×Var*(E) + 1×Var*(O) + 1×N̄* + λ×max(0, τ - Ā*)
    """
    if len(team_stats_list) < 2:
        return float('inf')  # Can't calculate variance with < 2 members

    C_values = [s["C"] for s in team_stats_list]
    A_values = [s["A"] for s in team_stats_list]
    E_values = [s["E"] for s in team_stats_list]
    O_values = [s["O"] for s in team_stats_list]
    N_values = [s["N"] for s in team_stats_list]

    def variance(values):
        n = len(values)
        mean_val = sum(values) / n
        return sum((x - mean_val) ** 2 for x in values) / n

    def var_star(values):
        return variance(values) / 400

    def xbar_star(values):
        mean_val = sum(values) / len(values)
        return (mean_val - 10) / 40

    N_bar_star = xbar_star(N_values)
    A_bar_star = xbar_star(A_values)

    cost = (
        1.5 * var_star(C_values) +
        1.5 * var_star(A_values) +
        1.0 * var_star(E_values) +
        1.0 * var_star(O_values) +
        1.0 * N_bar_star +
        LAMBDA * max(0, TAU - A_bar_star)
    )
    return cost

def calculate_team_score(cost):
    """Convert cost to score (0-100)"""
    denominator = 6 + LAMBDA * TAU  # = 7.25
    score = 100 * (1 - (cost / denominator))
    return max(0, min(100, int(round(score))))

def get_team_rating(s):
    if s >= 80:
        return "Excellent"
    elif s >= 65:
        return "Good"
    elif s >= 50:
        return "Acceptable"
    elif s >= 35:
        return "Risky"
    else:
        return "Not Recommended"
