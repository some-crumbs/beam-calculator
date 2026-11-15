from __future__ import annotations
import numpy as np # pyright: ignore[reportMissingImports]
from pytest import approx # pyright: ignore[reportMissingImports]
from beam.models import Beam
from beam.results import BeamResult
from beam.solver import internal_forces, solve_reactions, _load_points

def make_beam(supports, loads, length=6, hinges=()):
    return Beam(length=length, units="SI", supports=supports, loads=loads, hinges=list(hinges))

def simply_supported(loads):
    return make_beam([{"type": "pinned", "pos_x": 0}, {"type": "roller", "pos_x": 6}], loads)

def value_at(xs, ys, x):
    """Wartość wykresu w punkcie siatki najbliższym x."""
    return ys[int(np.argmin(np.abs(np.array(xs) - x)))]

def test_internal_forces():
    beam = make_beam(
        supports=[{"type": "pinned", "pos_x": 0}, {"type": "roller", "pos_x": 6}],
        loads=[{"type": "point", "pos_x": 3, "force": 1000}]
    )
    result = internal_forces(beam, solve_reactions(beam))
    assert len(result.x) == len(result.M) == len(result.V) == len(result.N)

def test_point_load_mid():                      # M_max = PL/4
    b = simply_supported([{"type": "point", "pos_x": 3, "force": 1000}])
    r = internal_forces(b, solve_reactions(b))
    assert value_at(r.x, r.V, 2) == approx(500)
    assert value_at(r.x, r.V, 4) == approx(-500)
    assert max(r.M) == approx(1500)
    assert r.M[0] == approx(0, abs=1e-6) and r.M[-1] == approx(0, abs=1e-6)

def test_uniform_load():                        # M_max = qL²/8
    b = simply_supported([{"type": "uniform", "start_x": 0, "end_x": 6, "q": 10}])
    r = internal_forces(b, solve_reactions(b))
    assert max(r.M) == approx(10 * 6**2 / 8, rel=1e-4)

def test_cantilever():                          # M(0) = −P·L
    b = make_beam([{"type": "fixed", "pos_x": 0}], [{"type": "point", "pos_x": 4, "force": 100}], length=4)
    r = internal_forces(b, solve_reactions(b))
    assert value_at(r.x, r.M, 1e-9) == approx(-400)

def test_gerber_hinge_moment_zero():            # M w przegubie = 0
    b = make_beam([{"type": "fixed", "pos_x": 0}, {"type": "roller", "pos_x": 5}],
                  [{"type": "uniform", "start_x": 0, "end_x": 5, "q": 10}], length=5, hinges=[{"pos_x": 2}])
    r = internal_forces(b, solve_reactions(b))
    assert value_at(r.x, r.M, 2) == approx(0, abs=1e-6)

def test_extra_point_element_adds_two_points():  # to, co sprawdzał Twój test, ale poprawnie
    b1 = simply_supported([{"type": "point", "pos_x": 3, "force": 1000}])
    b2 = simply_supported([{"type": "point", "pos_x": 3, "force": 1000},
                           {"type": "moment", "pos_x": 2, "moment": 100}])
    assert len(_load_points(b2)) == len(_load_points(b1)) + 2
