from __future__ import annotations

import math
import numpy as np

from .models import Beam, Load, PointLoad, PointMoment
from .results import BeamResult, Reaction

TOL = 1e-9

def _chop(values: list[float], tol: float = TOL) -> list[float]:
    """Treats every value < 1e-9 as a zero"""
    return [0.0 if abs(v) < tol else v for v in values]

def _load_points(beam: Beam, n: int = 501, eps: float = 1e-9) -> np.ndarray:
    """Adds points of load so the graph isnt smooth and is a jump in a point of load"""
    special = []
    for el in [*beam.supports, *beam.loads]:
        start, end = el.span()
        if start == end:
            special.append(start)
    special = np.array(special)

    points = np.concatenate([
        np.linspace(0, beam.length, n),
        special - eps,
        special + eps,
    ])

    return np.unique(np.clip(points, 0, beam.length))

def _reactions_as_loads(beam: Beam, reactions: list[Reaction]) -> list[Load]:
    """Treats reactions as loads"""
    supports = {s.id: s for s in beam.supports}
    loads = []

    for r in reactions:
        xs = supports[r.support_id].pos_x
        if r.kind == "horizontal":
            loads.append(PointLoad(pos_x=xs, force=r.value, angle=0))
        elif r.kind =="vertical":
            loads.append(PointLoad(pos_x=xs, force=r.value, angle=90))
        else:
            loads.append(PointMoment(pos_x=xs, moment=r.value))

    return loads

def solve(beam: Beam) -> BeamResult:
    """Solves a beam"""
    reactions = solve_reactions(beam)
    return internal_forces(beam, reactions)

def total_effect(loads: list[Load], x0: float, left_of: float = math.inf) -> tuple[float, float, float]:
    """Calculates the total effect of all of the loads"""
    fx = fy = m = 0.0
    for load in loads:
        dfx, dfy, dm = load.effect(x0, left_of)
        fx += dfx
        fy += dfy
        m += dm
    return (fx, fy, m)

def solve_reactions(beam: Beam) -> list[Reaction]:
    """Solves reactions"""
    if beam.indeterminacy > 0:
        raise ValueError("Beam is indeterminate")
    elif beam.indeterminacy < 0:
        raise ValueError("Mechanism")

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

    # fill vector b of the system A * r = b
    fx, fy, m = total_effect(beam.loads, x0=0)
    vector_b[0], vector_b[1], vector_b[2] = -fx, -fy, -m
    for row, hinge in enumerate(beam.hinges, start=3):
        vector_b[row] = -total_effect(beam.loads, x0=hinge.pos_x, left_of=hinge.pos_x)[2]

    if np.linalg.matrix_rank(matrix_A) != n:
        raise ValueError("Beam geometrically variable")
    
    r_value = np.linalg.solve(matrix_A, vector_b)

    return [
        Reaction(support_id = support.id, kind = kind, value = _chop([float(value)])[0])
        for (support, kind), value in zip(u_reactions, r_value)
    ]

def internal_forces(beam: Beam, reactions: list[Reaction]) -> BeamResult:
    """Solves internal forces and returns ready data sets for graphing"""
    xs = _load_points(beam)
    r_loads = _reactions_as_loads(beam, reactions)
    all_loads = [*beam.loads, *r_loads]
    N, V, M = [], [], []

    for x in xs:
        fx, fy, mx = total_effect(all_loads, x0=x, left_of=x)
        N.append(-fx)
        V.append(fy)
        M.append(-mx)

    return BeamResult(reactions=reactions, x=xs.tolist(), N=_chop(N), V=_chop(V), M=_chop(M))