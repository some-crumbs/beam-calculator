from __future__ import annotations

import math

from .models import Beam, Load
from .results import BeamResult, Reaction

def solve(beam: Beam) -> BeamResult:
    raise NotImplementedError  # Placeholder for the actual implementation of the beam analysis algorithm

# total_effect calculates the total effect of a list of loads at a specific point x0, considering only loads to the left of a specified position (left_of).
def total_effect(loads: list[Load], x0: float, left_of: float = math.inf) -> tuple[float, float, float]:
    fx = fy = m = 0.0
    for load in loads:
        dfx, dfy, dm = load.effect(x0, left_of)
        fx += dfx
        fy += dfy
        m += dm
    return (fx, fy, m)

def solve_reactions(beam: Beam) -> list[Reaction]:
    raise NotImplementedError  # Placeholder for the actual implementation of the reaction solving algorithm

def internal_forces(beam: Beam, reactions: list[Reaction]) -> BeamResult:
    raise NotImplementedError  # Placeholder for the actual implementation of the internal forces calculation