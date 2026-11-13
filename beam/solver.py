from __future__ import annotations

import math

from .models import Beam, Load
from .results import BeamResult, Reaction

def solve(beam: Beam) -> BeamResult:
    raise NotImplementedError  # Placeholder for the actual implementation of the beam analysis algorithm

def load_effect(load: Load, x0: float, left_of: float = math.inf) -> tuple[float, float, float]:
    raise NotImplementedError  # Placeholder for the actual implementation of the load effect calculation

def solve_reactions(beam: Beam) -> list[Reaction]:
    raise NotImplementedError  # Placeholder for the actual implementation of the reaction solving algorithm

def internal_forces(beam: Beam, reactions: list[Reaction]) -> BeamResult:
    raise NotImplementedError  # Placeholder for the actual implementation of the internal forces calculation