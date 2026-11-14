from __future__ import annotations

import math
import numpy as np # pyright: ignore[reportMissingImports]

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
    if beam.indeterminacy != 0:
        raise ValueError("Belka niewyznaczalna lub mechanizm")

    u_reactions = []
    for support in beam.supports:
        for kind in support.reaction_kinds:
            u_reactions.append((support, kind))
    
    n = len(u_reactions)
    matrix_A = np.zeros((n,n))
    vector_b = np.zeros((n))

    for j, (support, kind) in enumerate(u_reactions):
        xs = support.pos_x
        if kind == "horizontal":
            matrix_A[0, j] = 1
        elif kind == "vertical":
            matrix_A[1, j] = 1
            matrix_A[2, j] = xs
        else: # moment
            matrix_A[2, j] = 1
        for row, hinge in enumerate(beam.hinges, start=3):
            if xs >= hinge.pos_x:
                continue
            if kind == "vertical":
                matrix_A[row, j] = xs - hinge.pos_x
            elif kind == "moment":
                matrix_A[row, j] = 1

    # wypełnianie wektora b do równania A * r = b
    fx, fy, m = total_effect(beam.loads, x0=0)
    vector_b[0], vector_b[1], vector_b[2] = -fx, -fy, -m
    for row, hinge in enumerate(beam.hinges, start=3):
        vector_b[row] = -total_effect(beam.loads, x0=hinge.pos_x, left_of=hinge.pos_x)[2]

    if np.linalg.matrix_rank(matrix_A) != n:
        raise ValueError("Układ geometrycznie zmienny")
    
    r_value = np.linalg.solve(matrix_A, vector_b)

    return [
        Reaction(support_id = support.id, kind = kind, value = float(value))
        for (support, kind), value in zip(u_reactions, r_value)
    ]

def internal_forces(beam: Beam, reactions: list[Reaction]) -> BeamResult:
    raise NotImplementedError  # Placeholder for the actual implementation of the internal forces calculation