from pytest import approx, raises # pyright: ignore[reportMissingImports]
from beam.solver import solve_reactions
from beam.models import Beam

def make_beam(supports, loads, length=6, hinges=()):
    return Beam(length=length, units="SI", supports=supports, loads=loads, hinges=list(hinges))

def values(reactions):
    return [r.value for r in reactions]

def test_simply_supported_point_load():
    beam = make_beam(
        supports=[{"type": "pinned", "pos_x": 0}, {"type": "roller", "pos_x": 6}],
        loads=[{"type": "point", "pos_x": 3, "force": 1000}],
    )
    assert values(solve_reactions(beam)) == approx([0, 500, 500], abs=1e-9)

def test_cantilever():
    beam = make_beam(
        supports=[{"type": "fixed", "pos_x": 0}],
        loads=[{"type": "point", "pos_x": 4, "force": 100}],
        length=4,
    )
    assert values(solve_reactions(beam)) == approx([0, 100, 400], abs=1e-9)

def test_gerber():
    beam = make_beam(
        supports=[{"type": "fixed", "pos_x": 0}, {"type": "roller", "pos_x": 5}],
        loads=[{"type": "uniform", "start_x": 0, "end_x": 5, "q": 10}],
        hinges=[{"pos_x": 2}], length=5,
    )
    assert values(solve_reactions(beam)) == approx([0, 35, 50, 15], abs=1e-9)

def test_three_rollers_unstable():
    beam = make_beam(
        supports=[{"type": "roller", "pos_x": x} for x in (0, 3, 6)],
        loads=[],
    )
    with raises(ValueError):
        solve_reactions(beam)

def test_indetermine():
    beam = make_beam(
        supports=[{"type": "fixed", "pos_x": 0}, {"type": "roller", "pos_x": 6}],
        loads=[]
    )
    with raises(ValueError):
        solve_reactions(beam)

